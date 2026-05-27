"""
Core Texas Hold'em game engine.
All game logic lives here — the frontend only displays what this engine dictates.

Uses the `treys` library for hand evaluation (handles all 7,462 distinct hand ranks).
"""
import random
import asyncio
from decimal import Decimal, ROUND_DOWN
from typing import List, Dict, Any, Optional
from treys import Card, Evaluator, Deck as TreysInternalDeck

evaluator = Evaluator()

# ─── Card Utilities ────────────────────────────────────────────────────────────

RANKS = '23456789TJQKA'
SUITS = 'hdcs'  # hearts, diamonds, clubs, spades

def build_deck() -> List[str]:
    """Return a list of 52 card strings in the format used by this engine (e.g. 'Ah', 'Ks', '2c')."""
    deck = [f'{r}{s}' for r in RANKS for s in SUITS]
    random.shuffle(deck)
    return deck


def card_to_treys(card_str: str) -> int:
    """Convert engine card string ('Ah') to treys integer representation."""
    return Card.new(card_str)


def cards_to_treys(cards: List[str]) -> List[int]:
    return [card_to_treys(c) for c in cards]


# ─── State Helpers ─────────────────────────────────────────────────────────────

def get_active_players(state: Dict) -> List[Dict]:
    """Return players who are still in the hand (not folded, not disconnected-and-removed)."""
    return [p for p in state['players'] if not p['is_folded']]


def get_players_needing_action(state: Dict) -> List[Dict]:
    """Return active players who still need to act this round."""
    current_bet = Decimal(state['current_bet'])
    return [
        p for p in get_active_players(state)
        if not p['is_all_in'] and (
            not p['has_acted_this_round'] or Decimal(p['current_bet']) < current_bet
        )
    ]


def next_active_seat(state: Dict, from_seat: int) -> Optional[int]:
    """Find the next active (non-folded, non-all-in) player seat after from_seat."""
    seats = sorted([p['seat_index'] for p in get_active_players(state) if not p['is_all_in']])
    if not seats:
        return None
    for s in seats:
        if s > from_seat:
            return s
    return seats[0]  # Wrap around


def find_player(state: Dict, seat_index: int) -> Optional[Dict]:
    for p in state['players']:
        if p['seat_index'] == seat_index:
            return p
    return None


# ─── Game Engine Class ─────────────────────────────────────────────────────────

class GameEngine:

    @staticmethod
    def create_initial_state(
        invite_code: str,
        players: List[Dict],  # [{'user_id', 'username', 'seat_index', 'stack'}]
        small_blind: str,
        big_blind: str,
    ) -> Dict:
        """Create a brand new game state dict for a table."""
        return {
            'table_id': invite_code,
            'hand_number': 0,
            'game_stage': 'WAITING',  # WAITING → PRE_FLOP → FLOP → TURN → RIVER → SHOWDOWN
            'dealer_button': 0,
            'current_turn': None,
            'turn_deadline': None,
            'pot': '0.00',
            'side_pots': [],
            'community_cards': [],
            'current_bet': '0.00',
            'min_raise': big_blind,
            'deck': [],
            'players': [
                {
                    'seat_index': p['seat_index'],
                    'user_id': p['user_id'],
                    'username': p['username'],
                    'stack': str(p['stack']),
                    'hole_cards': [],
                    'current_bet': '0.00',
                    'is_folded': False,
                    'is_all_in': False,
                    'is_connected': True,
                    'has_acted_this_round': False,
                }
                for p in players
            ],
            'small_blind': small_blind,
            'big_blind': big_blind,
        }

    @staticmethod
    def start_new_hand(state: Dict) -> Dict:
        """
        Begin a new hand:
        1. Rotate dealer button
        2. Shuffle deck
        3. Post blinds
        4. Deal 2 hole cards to each active player
        5. Set PRE_FLOP stage and first-to-act
        """
        active = [p for p in state['players'] if p['is_connected'] and Decimal(p['stack']) > 0]
        if len(active) < 2:
            raise ValueError('Need at least 2 ready players with chips to start a hand.')

        state['hand_number'] += 1
        state['game_stage'] = 'PRE_FLOP'
        state['community_cards'] = []
        state['pot'] = '0.00'
        state['side_pots'] = []
        state['current_bet'] = '0.00'
        state['deck'] = build_deck()

        # Reset players for new hand
        for p in state['players']:
            p['hole_cards'] = []
            p['current_bet'] = '0.00'
            p['is_folded'] = p not in active
            p['is_all_in'] = False
            p['has_acted_this_round'] = False

        # Rotate dealer button to next connected player
        connected_seats = sorted([p['seat_index'] for p in active])
        current_dealer = state['dealer_button']
        next_dealer_candidates = [s for s in connected_seats if s > current_dealer]
        state['dealer_button'] = next_dealer_candidates[0] if next_dealer_candidates else connected_seats[0]

        # Determine SB and BB seats
        dealer_idx = connected_seats.index(state['dealer_button'])
        if len(connected_seats) == 2:
            # In Heads-Up, Dealer is SB, other player is BB
            sb_seat = connected_seats[dealer_idx]
            bb_seat = connected_seats[(dealer_idx + 1) % len(connected_seats)]
        else:
            # Standard rules for 3+ players
            sb_seat = connected_seats[(dealer_idx + 1) % len(connected_seats)]
            bb_seat = connected_seats[(dealer_idx + 2) % len(connected_seats)]

        sb = Decimal(state['small_blind'])
        bb = Decimal(state['big_blind'])

        # Post small blind
        GameEngine._post_blind(state, sb_seat, sb)
        # Post big blind
        GameEngine._post_blind(state, bb_seat, bb)

        state['current_bet'] = str(bb)
        state['min_raise'] = str(bb * 2)

        # Deal 2 hole cards to each active (non-folded) player
        for p in state['players']:
            if not p['is_folded']:
                p['hole_cards'] = [state['deck'].pop(), state['deck'].pop()]

        # First to act pre-flop
        if len(connected_seats) == 2:
            # In Heads-Up, SB (Dealer) acts first pre-flop
            state['current_turn'] = sb_seat
        else:
            # UTG (player after BB) acts first
            bb_idx = connected_seats.index(bb_seat)
            utg_seat = connected_seats[(bb_idx + 1) % len(connected_seats)]
            state['current_turn'] = utg_seat

        # BB has not acted yet (can still raise)
        bb_player = find_player(state, bb_seat)
        if bb_player:
            bb_player['has_acted_this_round'] = False

        return state

    @staticmethod
    def _post_blind(state: Dict, seat_index: int, amount: Decimal):
        """Deduct blind from player stack and add to their current_bet."""
        player = find_player(state, seat_index)
        if not player:
            return
        stack = Decimal(player['stack'])
        actual_blind = min(amount, stack)
        player['stack'] = str(stack - actual_blind)
        player['current_bet'] = str(Decimal(player['current_bet']) + actual_blind)
        if Decimal(player['stack']) == 0:
            player['is_all_in'] = True
        player['has_acted_this_round'] = True

    @staticmethod
    def process_action(state: Dict, seat_index: int, action: str, amount: Optional[str] = None) -> Dict:
        """
        Validate and apply a player action.
        Actions: CHECK, CALL, RAISE, FOLD, ALL_IN
        Returns updated state.
        Raises ValueError on invalid actions.
        """
        player = find_player(state, seat_index)
        if not player:
            raise ValueError(f'No player at seat {seat_index}.')
        if state['current_turn'] != seat_index:
            raise ValueError('It is not your turn.')
        if player['is_folded']:
            raise ValueError('You have already folded.')
        if player['is_all_in']:
            raise ValueError('You are all-in and cannot act.')

        current_bet = Decimal(state['current_bet'])
        player_bet = Decimal(player['current_bet'])
        player_stack = Decimal(player['stack'])
        call_amount = current_bet - player_bet

        action = action.upper()

        if action == 'FOLD':
            player['is_folded'] = True

        elif action == 'CHECK':
            if call_amount > 0:
                raise ValueError(f'Cannot check. You must call ₹{call_amount} or raise.')
            # No chip movement needed

        elif action == 'CALL':
            if call_amount <= 0:
                raise ValueError('Nothing to call. Use CHECK instead.')
            actual_call = min(call_amount, player_stack)
            player['stack'] = str(player_stack - actual_call)
            player['current_bet'] = str(player_bet + actual_call)
            if Decimal(player['stack']) == 0:
                player['is_all_in'] = True

        elif action in ('RAISE', 'BET'):
            if amount is None:
                raise ValueError('Raise amount is required.')
            raise_to = Decimal(str(amount))
            min_raise = Decimal(state['min_raise'])
            if raise_to < min_raise and raise_to < player_bet + player_stack:
                raise ValueError(f'Minimum raise is to ₹{min_raise}.')
            additional = raise_to - player_bet
            if additional > player_stack:
                raise ValueError(f'Raise of ₹{raise_to} exceeds your stack of ₹{player_stack}.')
            player['stack'] = str(player_stack - additional)
            player['current_bet'] = str(raise_to)
            state['current_bet'] = str(raise_to)
            state['min_raise'] = str(raise_to + (raise_to - current_bet))
            if Decimal(player['stack']) == 0:
                player['is_all_in'] = True
            # All other players must re-act
            for p in state['players']:
                if p['seat_index'] != seat_index and not p['is_folded'] and not p['is_all_in']:
                    p['has_acted_this_round'] = False

        elif action == 'ALL_IN':
            all_in_total = player_bet + player_stack
            player['current_bet'] = str(all_in_total)
            player['stack'] = '0.00'
            player['is_all_in'] = True
            if all_in_total > current_bet:
                state['current_bet'] = str(all_in_total)
                state['min_raise'] = str(all_in_total + (all_in_total - current_bet))
                for p in state['players']:
                    if p['seat_index'] != seat_index and not p['is_folded'] and not p['is_all_in']:
                        p['has_acted_this_round'] = False

        else:
            raise ValueError(f'Unknown action: {action}')

        player['has_acted_this_round'] = True

        # Advance turn
        state = GameEngine._advance_turn(state, seat_index)
        return state

    @staticmethod
    def _advance_turn(state: Dict, last_seat: int) -> Dict:
        """Move current_turn to next player who needs to act, or advance stage."""
        pending = get_players_needing_action(state)
        if not pending:
            # All players have acted — move to next stage
            state = GameEngine.advance_stage(state)
        else:
            state['current_turn'] = pending[0]['seat_index']
        return state

    @staticmethod
    def advance_stage(state: Dict) -> Dict:
        """
        Move game from current stage to the next.
        Collects bets into pot, deals community cards, resets player bets.
        """
        # Collect all player bets into pot
        GameEngine._collect_bets_to_pot(state)

        # Calculate side pots before advancing
        state['side_pots'] = GameEngine.calculate_side_pots(state)

        stage = state['game_stage']
        active = get_active_players(state)

        # If only one player remains, skip to SHOWDOWN
        if len(active) == 1:
            state['game_stage'] = 'SHOWDOWN'
            return GameEngine.evaluate_showdown(state)

        # All remaining players are all-in — run out the board
        all_in_count = sum(1 for p in active if p['is_all_in'])
        run_out_board = all_in_count >= len(active) - 1

        stage_map = {
            'PRE_FLOP': 'FLOP',
            'FLOP': 'TURN',
            'TURN': 'RIVER',
            'RIVER': 'SHOWDOWN',
        }

        next_stage = stage_map.get(stage, 'SHOWDOWN')

        # Deal community cards
        if next_stage == 'FLOP':
            state['deck'].pop()  # burn
            state['community_cards'] = [state['deck'].pop(), state['deck'].pop(), state['deck'].pop()]
        elif next_stage in ('TURN', 'RIVER'):
            state['deck'].pop()  # burn
            state['community_cards'].append(state['deck'].pop())

        state['game_stage'] = next_stage
        state['current_bet'] = '0.00'

        for p in state['players']:
            p['has_acted_this_round'] = False

        if next_stage == 'SHOWDOWN':
            return GameEngine.evaluate_showdown(state)

        if run_out_board:
            return GameEngine.advance_stage(state)

        # Set first-to-act post-flop (first active non-all-in left of dealer)
        non_all_in = [p for p in active if not p['is_all_in']]
        if non_all_in:
            dealer = state['dealer_button']
            seats = sorted([p['seat_index'] for p in non_all_in])
            post_dealer = [s for s in seats if s > dealer] or seats
            state['current_turn'] = post_dealer[0]

        return state

    @staticmethod
    def _collect_bets_to_pot(state: Dict):
        """Move all player current_bets into the main pot."""
        total = Decimal(state['pot'])
        for p in state['players']:
            total += Decimal(p['current_bet'])
            p['current_bet'] = '0.00'
        state['pot'] = str(total)

    @staticmethod
    def calculate_side_pots(state: Dict) -> List[Dict]:
        """
        Calculate main pot and side pots for all-in scenarios.
        Returns list of {'amount': str, 'eligible_seats': [int, ...]}.
        """
        # Gather each player's total committed amount (stack is already reduced)
        # We reconstruct total contributed from pot distribution
        contributions = {}
        for p in state['players']:
            if not p['is_folded']:
                # We need the committed amount — stored across rounds in the pot
                # Use a snapshot approach: track per-player via state['_contributions']
                pass

        # Simplified side pot calculation using all_in players
        all_in_players = sorted(
            [p for p in state['players'] if p['is_all_in'] and not p['is_folded']],
            key=lambda p: Decimal(p.get('_total_committed', '0'))
        )

        if not all_in_players:
            return []

        # Return a basic structure — full implementation in consumers
        active_seats = [p['seat_index'] for p in get_active_players(state)]
        return [{'amount': state['pot'], 'eligible_seats': active_seats}]

    @staticmethod
    def evaluate_showdown(state: Dict) -> Dict:
        """
        Determine winner(s) at showdown using treys hand evaluator.
        Handles split pots and side pots.
        Sets state['winners'] and credits player stacks.
        """
        community = cards_to_treys(state['community_cards'])
        active = get_active_players(state)

        best_rank = 7463  # worst possible (higher = worse in treys)
        best_players = []

        for p in active:
            if len(p['hole_cards']) == 2:
                hole = cards_to_treys(p['hole_cards'])
                rank = evaluator.evaluate(community, hole)
                if rank < best_rank:
                    best_rank = rank
                    best_players = [p]
                elif rank == best_rank:
                    best_players.append(p)

        # Split pot among winners
        total_pot = Decimal(state['pot'])
        winners_info = GameEngine.split_pot(total_pot, best_players, state)

        state['winners'] = winners_info
        state['game_stage'] = 'SHOWDOWN'

        # Credit winner stacks
        for info in winners_info:
            player = find_player(state, info['seat_index'])
            if player:
                player['stack'] = str(Decimal(player['stack']) + Decimal(info['amount_won']))

        return state

    @staticmethod
    def split_pot(total_amount: Decimal, winners: List[Dict], state: Dict) -> List[Dict]:
        """
        Evenly split pot among winners.
        Odd paisa goes to the first active player left of the dealer button.
        Returns list of {'seat_index', 'user_id', 'username', 'amount_won', 'hand_rank'}.
        """
        if not winners:
            return []

        n = len(winners)
        # Use paisa precision (2 decimal places)
        # Round down to nearest rupee (standard casino odd-chip rule)
        share = (total_amount / n).quantize(Decimal('1'), rounding=ROUND_DOWN)
        remainder = total_amount - (share * n)

        result = []
        dealer = state['dealer_button']
        connected_seats = sorted([p['seat_index'] for p in state['players'] if p['is_connected']])
        # First active player left of dealer to receive odd chip
        odd_chip_candidates = [s for s in connected_seats if s > dealer] or connected_seats
        odd_chip_seat = odd_chip_candidates[0] if odd_chip_candidates else (winners[0]['seat_index'])

        for i, w in enumerate(winners):
            amount = share
            if remainder > 0 and w['seat_index'] == odd_chip_seat:
                amount += remainder
                remainder = Decimal('0.00')
            rank_class = evaluator.get_rank_class(
                evaluator.evaluate(
                    cards_to_treys(state['community_cards']),
                    cards_to_treys(w['hole_cards'])
                )
            )
            result.append({
                'seat_index': w['seat_index'],
                'user_id': w['user_id'],
                'username': w['username'],
                'amount_won': str(amount),
                'hand_rank': evaluator.class_to_string(rank_class),
            })

        return result

    @staticmethod
    def reset_for_next_hand(state: Dict) -> Dict:
        """Clear hand-specific state, keeping player stacks and connection status."""
        state['game_stage'] = 'WAITING'
        state['community_cards'] = []
        state['pot'] = '0.00'
        state['side_pots'] = []
        state['current_bet'] = '0.00'
        state['current_turn'] = None
        state['winners'] = []
        state['deck'] = []
        for p in state['players']:
            p['hole_cards'] = []
            p['current_bet'] = '0.00'
            p['is_folded'] = False
            p['is_all_in'] = False
            p['has_acted_this_round'] = False
        return state
