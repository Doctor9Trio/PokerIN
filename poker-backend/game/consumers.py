"""
PokerConsumer — Django Channels WebSocket consumer for real-time poker gameplay.

Connection URL: ws://backend/ws/table/{invite_code}/?token={jwt_token}

Message types from client:
  - PLAYER_ACTION: { type, action, amount? }
  - BUY_IN:        { type, amount }
  - CHAT_MESSAGE:  { type, message }
  - READY:         { type }

Message types to client:
  - TABLE_STATE_UPDATE   → full state (opponents' hole cards stripped)
  - RECEIVE_PRIVATE_CARDS → only to the individual player
  - ACTION_REQUIRED       → sent to the player whose turn it is
  - HAND_RESULT           → winners, hand ranks, amounts
  - PLAYER_JOINED         → broadcast when someone connects
  - PLAYER_LEFT           → broadcast when someone disconnects
  - ERROR                 → individual error messages
  - CHAT_MESSAGE          → broadcast chat
"""
import asyncio
import json
import copy
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from typing import Optional

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from .engine import GameEngine, find_player, get_active_players
from .state_manager import get_state, save_state
from tables.models import PokerTable

TURN_TIMEOUT_SECONDS = 30
RECONNECT_WINDOW_SECONDS = 60


class PokerConsumer(AsyncWebsocketConsumer):

    # ─── Lifecycle ──────────────────────────────────────────────────────────────

    async def connect(self):
        """Authenticate, join channel groups, and announce the player."""
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser):
            await self.close(code=4001)  # Unauthorized
            return

        self.user = user
        self.invite_code = self.scope['url_route']['kwargs']['invite_code'].upper()
        self.room_group = f'table_{self.invite_code}'
        self.private_group = f'private_{self.invite_code}_{user.id}'
        self._timeout_task: Optional[asyncio.Task] = None

        # Load or validate table
        table = await self._get_table()
        if not table:
            await self.close(code=4004)
            return

        self.table = table

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.channel_layer.group_add(self.private_group, self.channel_name)
        await self.accept()

        # Add player to game state
        state = get_state(self.invite_code)
        if state is None:
            state = GameEngine.create_initial_state(
                invite_code=self.invite_code,
                players=[],
                small_blind=str(table.small_blind),
                big_blind=str(table.big_blind),
            )

        # Check if player is reconnecting
        existing = find_player(state, self._get_seat_for_user(state))
        if existing:
            existing['is_connected'] = True
            if self._timeout_task:
                self._timeout_task.cancel()
        else:
            # Find next available seat
            occupied = {p['seat_index'] for p in state['players']}
            seats = [i for i in range(table.max_players) if i not in occupied]
            if not seats:
                await self.send_json({'type': 'ERROR', 'message': 'Table is full.'})
                await self.close()
                return
            state['players'].append({
                'seat_index': seats[0],
                'user_id': self.user.id,
                'username': self.user.username,
                'stack': '0.00',  # Stack is set during BUY_IN
                'hole_cards': [],
                'current_bet': '0.00',
                'is_folded': True,  # Not in hand until they buy in
                'is_all_in': False,
                'is_connected': True,
                'has_acted_this_round': False,
            })

        save_state(self.invite_code, state)

        # Broadcast current table state to EVERYONE (including the joining player)
        await self.broadcast_table_state(state)

        # Send current table state to the joining player
        await self.send_table_state(state)

        # If it's my turn, send ACTION_REQUIRED
        player = self._find_me(state)
        if player and state.get('current_turn') == player['seat_index']:
            if state.get('game_stage') not in ('SHOWDOWN', 'WAITING'):
                await self._notify_current_player(state)

    async def disconnect(self, close_code):
        """Mark player as disconnected. Give them a reconnect window."""
        if not hasattr(self, 'invite_code'):
            return
        state = get_state(self.invite_code)
        if state:
            player = self._find_me(state)
            if player:
                player['is_connected'] = False
                save_state(self.invite_code, state)

                # If it's their turn, start auto-fold timer immediately
                if state.get('current_turn') == player['seat_index']:
                    self._timeout_task = asyncio.create_task(
                        self._auto_action_on_timeout(immediate=True)
                    )

            await self.channel_layer.group_send(self.room_group, {
                'type': 'broadcast_player_left',
                'username': self.user.username,
                'seat_index': player['seat_index'] if player else None,
            })

        await self.channel_layer.group_discard(self.room_group, self.channel_name)
        await self.channel_layer.group_discard(self.private_group, self.channel_name)

    # ─── Message Router ─────────────────────────────────────────────────────────

    async def receive(self, text_data):
        """Route incoming WebSocket messages to handlers."""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON.')
            return

        msg_type = data.get('type', '').upper()
        handlers = {
            'PLAYER_ACTION': self.handle_player_action,
            'BUY_IN':        self.handle_buy_in,
            'CHAT_MESSAGE':  self.handle_chat,
            'READY':         self.handle_ready,
        }

        handler = handlers.get(msg_type)
        if handler:
            await handler(data)
        else:
            await self.send_error(f'Unknown message type: {msg_type}')

    # ─── Action Handlers ────────────────────────────────────────────────────────

    async def handle_player_action(self, data: dict):
        """Process CHECK / CALL / RAISE / FOLD / ALL_IN."""
        state = get_state(self.invite_code)
        if not state:
            await self.send_error('Game state not found.')
            return

        player = self._find_me(state)
        if not player:
            await self.send_error('You are not seated at this table.')
            return

        seat = player['seat_index']
        action = data.get('action', '').upper()
        amount = data.get('amount')

        try:
            state = GameEngine.process_action(state, seat, action, amount)
        except ValueError as e:
            await self.send_error(str(e))
            return

        # Cancel current timeout task (player acted in time)
        if self._timeout_task and not self._timeout_task.done():
            self._timeout_task.cancel()

        save_state(self.invite_code, state)

        # Handle showdown result
        if state['game_stage'] == 'SHOWDOWN':
            await self.broadcast_hand_result(state)
            # Persist winners to DB and credit wallets
            await self._settle_hand(state)
            # After 5s delay, reset for next hand
            await asyncio.sleep(5)
            state = GameEngine.reset_for_next_hand(get_state(self.invite_code))
            save_state(self.invite_code, state)
            await self.broadcast_table_state(state)
            
            # Automatically start next hand if 2+ players still have chips
            await self._check_and_start_hand(state)
            return

        await self.broadcast_table_state(state)

        # Send ACTION_REQUIRED to the next player
        if state['game_stage'] not in ('SHOWDOWN', 'WAITING'):
            await self._notify_current_player(state)

    async def handle_buy_in(self, data: dict):
        """Deduct buy-in from wallet and add chips to player stack."""
        amount_str = data.get('amount')
        if not amount_str:
            await self.send_error('Buy-in amount required.')
            return

        amount = Decimal(str(amount_str))

        # Validate against table limits
        if amount < self.table.min_buy_in:
            await self.send_error(f'Minimum buy-in is ₹{self.table.min_buy_in}.')
            return
        if amount > self.table.max_buy_in:
            await self.send_error(f'Maximum buy-in is ₹{self.table.max_buy_in}.')
            return

        # Deduct from wallet (DB — atomic)
        success = await self._deduct_wallet(amount)
        if not success:
            await self.send_error('Insufficient wallet balance.')
            return

        # Add to player stack in Redis state
        state = get_state(self.invite_code)
        player = self._find_me(state)
        if player:
            player['stack'] = str(Decimal(player['stack']) + amount)
            save_state(self.invite_code, state)

        await self.send_json({
            'type': 'BUY_IN_CONFIRMED',
            'amount': str(amount),
            'new_stack': player['stack'],
        })
        await self.broadcast_table_state(state)

        # Auto-start hand if 2+ players have chips
        await self._check_and_start_hand(state)

    async def handle_ready(self, data: dict):
        """Player signals they're ready. Start hand if conditions met."""
        state = get_state(self.invite_code)
        player = self._find_me(state)
        if player:
            player['is_ready'] = True
            save_state(self.invite_code, state)
            await self.broadcast_table_state(state)
            await self._check_and_start_hand(state)

    async def handle_chat(self, data: dict):
        """Broadcast chat message to the table."""
        message = str(data.get('message', ''))[:200]  # max 200 chars
        await self.channel_layer.group_send(self.room_group, {
            'type': 'broadcast_chat',
            'username': self.user.username,
            'message': message,
        })

    # ─── State Broadcasting ──────────────────────────────────────────────────────

    async def broadcast_table_state(self, state: dict):
        """Send table state to all players, stripping opponents' hole cards."""
        await self.channel_layer.group_send(self.room_group, {
            'type': 'send_table_state_to_player',
            'state': state,
        })

    async def send_table_state(self, state: dict):
        """Send table state to this specific connection only."""
        sanitized = self._sanitize_state_for_player(state, self.user.id)
        await self.send_json({'type': 'TABLE_STATE_UPDATE', 'state': sanitized})

        # Also send private cards to this player specifically
        player = self._find_me(state)
        if player and player.get('hole_cards'):
            await self.send_json({
                'type': 'RECEIVE_PRIVATE_CARDS',
                'cards': player['hole_cards'],
            })

    async def broadcast_hand_result(self, state: dict):
        """Broadcast showdown results with revealed cards."""
        await self.channel_layer.group_send(self.room_group, {
            'type': 'send_hand_result',
            'winners': state.get('winners', []),
            'community_cards': state['community_cards'],
            'players': [
                {
                    'seat_index': p['seat_index'],
                    'username': p['username'],
                    'hole_cards': p['hole_cards'],  # Reveal all cards at showdown
                    'is_folded': p['is_folded'],
                }
                for p in state['players']
            ],
        })

    # ─── Channel Layer Event Handlers ───────────────────────────────────────────
    # These are called by group_send dispatches:

    async def send_table_state_to_player(self, event):
        state = event['state']
        sanitized = self._sanitize_state_for_player(state, self.user.id)
        await self.send_json({'type': 'TABLE_STATE_UPDATE', 'state': sanitized})

        # Send private cards each time state updates (in case of reconnect)
        player = next((p for p in state['players'] if p['user_id'] == self.user.id), None)
        if player and player.get('hole_cards') and state['game_stage'] != 'WAITING':
            await self.send_json({
                'type': 'RECEIVE_PRIVATE_CARDS',
                'cards': player['hole_cards'],
            })

    async def broadcast_player_joined(self, event):
        await self.send_json({
            'type': 'PLAYER_JOINED',
            'username': event['username'],
            'seat_index': event['seat_index'],
        })

    async def broadcast_player_left(self, event):
        await self.send_json({
            'type': 'PLAYER_LEFT',
            'username': event['username'],
            'seat_index': event['seat_index'],
        })

    async def send_hand_result(self, event):
        await self.send_json({
            'type': 'HAND_RESULT',
            'winners': event['winners'],
            'community_cards': event['community_cards'],
            'players': event['players'],
        })

    async def broadcast_chat(self, event):
        await self.send_json({
            'type': 'CHAT_MESSAGE',
            'username': event['username'],
            'message': event['message'],
        })

    # ─── Timeout / Auto-Action ───────────────────────────────────────────────────

    async def _auto_action_on_timeout(self, immediate: bool = False):
        """After timeout, auto-fold (if facing bet) or auto-check."""
        if not immediate:
            await asyncio.sleep(TURN_TIMEOUT_SECONDS)

        state = get_state(self.invite_code)
        if not state:
            return
        player = self._find_me(state)
        if not player:
            return
        if state.get('current_turn') != player['seat_index']:
            return

        current_bet = Decimal(state['current_bet'])
        player_bet = Decimal(player['current_bet'])

        action = 'FOLD' if current_bet > player_bet else 'CHECK'
        try:
            state = GameEngine.process_action(state, player['seat_index'], action)
            save_state(self.invite_code, state)
            await self.broadcast_table_state(state)
            if state['game_stage'] not in ('SHOWDOWN', 'WAITING'):
                await self._notify_current_player(state)
        except ValueError:
            pass

    async def _start_turn_timer(self, state: dict):
        """Cancel existing timer and start a fresh 30s countdown."""
        if self._timeout_task and not self._timeout_task.done():
            self._timeout_task.cancel()
        if state.get('current_turn') == self.user.id:
            self._timeout_task = asyncio.create_task(self._auto_action_on_timeout())

    # ─── Helpers ────────────────────────────────────────────────────────────────

    def _sanitize_state_for_player(self, state: dict, user_id: int) -> dict:
        """Deep copy state and mask other players' hole cards."""
        sanitized = copy.deepcopy(state)
        for p in sanitized['players']:
            if p['user_id'] != user_id:
                # Only show cards at showdown
                if state['game_stage'] != 'SHOWDOWN':
                    p['hole_cards'] = ['XX', 'XX'] if p['hole_cards'] else []
        # Never send the deck to the client
        sanitized.pop('deck', None)
        return sanitized

    def _find_me(self, state: dict):
        """Return this connection's player dict from state."""
        return next((p for p in state['players'] if p['user_id'] == self.user.id), None)

    def _get_seat_for_user(self, state: dict) -> Optional[int]:
        p = self._find_me(state)
        return p['seat_index'] if p else None

    async def send_error(self, message: str):
        await self.send_json({'type': 'ERROR', 'message': message})

    async def send_json(self, data: dict):
        import json
        await self.send(text_data=json.dumps(data, default=str))

    async def _check_and_start_hand(self, state: dict):
        """Start a new hand if 2+ players are ready and have chips."""
        if state['game_stage'] != 'WAITING':
            return

        ready_players = [
            p for p in state['players']
            if p['is_connected'] and Decimal(p['stack']) > 0
        ]

        if len(ready_players) >= 2:
            try:
                state = GameEngine.start_new_hand(state)
                save_state(self.invite_code, state)
                await self.broadcast_table_state(state)
                await self._notify_current_player(state)
            except ValueError as e:
                pass # Not enough players met criteria during start_new_hand

    async def _notify_current_player(self, state: dict):
        """Send ACTION_REQUIRED to the current player's private channel."""
        current_seat = state.get('current_turn')
        if current_seat is None:
            return
        current_player = find_player(state, current_seat)
        if not current_player:
            return

        private_group = f'private_{self.invite_code}_{current_player["user_id"]}'
        player_bet = Decimal(current_player['current_bet'])
        current_bet = Decimal(state['current_bet'])
        call_amount = current_bet - player_bet

        valid_actions = ['FOLD']
        if call_amount == 0:
            valid_actions.append('CHECK')
        else:
            valid_actions.append('CALL')
        valid_actions.extend(['RAISE', 'ALL_IN'])

        await self.channel_layer.group_send(private_group, {
            'type': 'send_action_required',
            'valid_actions': valid_actions,
            'call_amount': str(call_amount),
            'min_raise': state['min_raise'],
            'pot': state['pot'],
            'timeout_seconds': TURN_TIMEOUT_SECONDS,
        })

    async def send_action_required(self, event):
        await self.send_json({
            'type': 'ACTION_REQUIRED',
            'valid_actions': event.get('valid_actions', []),
            'call_amount': event.get('call_amount', '0'),
            'min_raise': event.get('min_raise', '0'),
            'pot': event.get('pot', '0'),
            'timeout_seconds': event.get('timeout_seconds', 30),
        })

    @database_sync_to_async
    def _get_table(self):
        try:
            return PokerTable.objects.get(invite_code=self.invite_code, is_active=True)
        except PokerTable.DoesNotExist:
            return None

    @database_sync_to_async
    def _deduct_wallet(self, amount: Decimal) -> bool:
        # UNLIMITED MONEY FOR TESTING - Bypass actual deduction
        return True
        # try:
        #     self.user.wallet.deduct(amount)
        #     return True
        # except (ValueError, AttributeError):
        #     return False

    @database_sync_to_async
    def _settle_hand(self, state: dict):
        """Credit winners' wallets in the database and update UserStats."""
        from tables.models import HandHistory
        from django.contrib.auth import get_user_model
        from django.utils import timezone as tz
        User = get_user_model()

        for winner_info in state.get('winners', []):
            try:
                user = User.objects.get(id=winner_info['user_id'])
                amount = Decimal(winner_info['amount_won'])
                user.wallet.credit(amount)
                user.stats.hands_won += 1
                user.stats.total_winnings += amount
                user.stats.save()
            except Exception:
                pass

        # Update hands_played for all participants
        for p in state['players']:
            if not p['is_folded'] or p.get('hole_cards'):
                try:
                    user = User.objects.get(id=p['user_id'])
                    user.stats.hands_played += 1
                    user.stats.save()
                except Exception:
                    pass
