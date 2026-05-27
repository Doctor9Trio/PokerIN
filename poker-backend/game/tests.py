"""
Backend unit tests for the game engine.
Run with: python manage.py test game.tests
"""
from decimal import Decimal
from django.test import TestCase
from .engine import GameEngine, build_deck


def make_test_state(n_players=2):
    """Helper: create a minimal game state for testing."""
    players = [
        {'user_id': i + 1, 'username': f'Player{i+1}', 'seat_index': i, 'stack': '5000'}
        for i in range(n_players)
    ]
    state = GameEngine.create_initial_state(
        invite_code='TEST01',
        players=players,
        small_blind='50',
        big_blind='100',
    )
    return state


class TestGameEngine(TestCase):

    def test_start_new_hand_deals_cards(self):
        state = make_test_state(2)
        state = GameEngine.start_new_hand(state)
        for p in state['players']:
            self.assertEqual(len(p['hole_cards']), 2, f'{p["username"]} should have 2 cards')

    def test_blinds_posted(self):
        state = make_test_state(2)
        state = GameEngine.start_new_hand(state)
        total_bet = sum(Decimal(p['current_bet']) for p in state['players'])
        self.assertEqual(total_bet, Decimal('150'))  # SB(50) + BB(100)

    def test_fold_removes_player_from_active(self):
        state = make_test_state(2)
        state = GameEngine.start_new_hand(state)
        first_to_act = state['current_turn']
        state = GameEngine.process_action(state, first_to_act, 'FOLD')
        active = [p for p in state['players'] if not p['is_folded']]
        self.assertEqual(len(active), 1)

    def test_cannot_check_when_facing_bet(self):
        state = make_test_state(2)
        state = GameEngine.start_new_hand(state)
        first_to_act = state['current_turn']
        with self.assertRaises(ValueError):
            GameEngine.process_action(state, first_to_act, 'CHECK')

    def test_call_deducts_correct_amount(self):
        state = make_test_state(2)
        state = GameEngine.start_new_hand(state)
        first_to_act = state['current_turn']
        player = next(p for p in state['players'] if p['seat_index'] == first_to_act)
        stack_before = Decimal(player['stack'])
        state = GameEngine.process_action(state, first_to_act, 'CALL')
        player_after = next(p for p in state['players'] if p['seat_index'] == first_to_act)
        stack_after = Decimal(player_after['stack'])
        # Player called BB=100, they were SB so called 50 more
        self.assertEqual(stack_before - stack_after, Decimal('50'))

    def test_raise_updates_min_raise(self):
        state = make_test_state(2)
        state = GameEngine.start_new_hand(state)
        first_to_act = state['current_turn']
        state = GameEngine.process_action(state, first_to_act, 'RAISE', '300')
        self.assertEqual(state['current_bet'], '300')
        self.assertEqual(Decimal(state['min_raise']), Decimal('500'))  # 300 + (300-100)

    def test_split_pot_two_equal_winners(self):
        """Two players tie → pot split evenly."""
        state = make_test_state(2)
        state['pot'] = '1000.00'
        winners = state['players'][:2]
        for w in winners:
            w['hole_cards'] = ['As', 'Ah']  # Same cards for test
        state['community_cards'] = ['2c', '3d', '5h', '7s', '9c']
        # Just test the split math
        result = GameEngine.split_pot(Decimal('1000'), winners, state)
        amounts = [Decimal(r['amount_won']) for r in result]
        self.assertEqual(sum(amounts), Decimal('1000'))

    def test_odd_chip_distribution(self):
        """Odd paisa goes to first player left of dealer."""
        state = make_test_state(2)
        state['pot'] = '101.00'
        state['dealer_button'] = 0
        winners = state['players'][:2]
        for w in winners:
            w['hole_cards'] = ['As', 'Ah']
        state['community_cards'] = ['2c', '3d', '5h', '7s', '9c']
        result = GameEngine.split_pot(Decimal('101'), winners, state)
        amounts = [Decimal(r['amount_won']) for r in result]
        self.assertEqual(sum(amounts), Decimal('101'))
        # One player gets 50.50 and the other gets 50.50 → actually 51 + 50
        self.assertIn(Decimal('51.00'), amounts)
        self.assertIn(Decimal('50.00'), amounts)

    def test_deck_has_52_cards(self):
        deck = build_deck()
        self.assertEqual(len(deck), 52)
        self.assertEqual(len(set(deck)), 52)  # All unique

    def test_stage_advances_after_all_act(self):
        state = make_test_state(2)
        state = GameEngine.start_new_hand(state)
        # In heads-up, both players act
        seat0 = state['current_turn']
        state = GameEngine.process_action(state, seat0, 'CALL')
        seat1 = state['current_turn']
        state = GameEngine.process_action(state, seat1, 'CHECK')
        # Should now be on FLOP
        self.assertEqual(state['game_stage'], 'FLOP')
        self.assertEqual(len(state['community_cards']), 3)
