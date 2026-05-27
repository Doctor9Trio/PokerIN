import random
import string
from django.db import models
from django.conf import settings


def generate_invite_code():
    """Generate a unique 6-character alphanumeric invite code."""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not PokerTable.objects.filter(invite_code=code).exists():
            return code


class PokerTable(models.Model):
    """A poker table / room configuration."""

    MAX_PLAYERS_CHOICES = [(2, '2'), (6, '6'), (9, '9')]

    invite_code = models.CharField(max_length=6, unique=True, default=generate_invite_code)
    name = models.CharField(max_length=100)
    small_blind = models.DecimalField(max_digits=10, decimal_places=2)   # INR
    big_blind = models.DecimalField(max_digits=10, decimal_places=2)     # INR
    min_buy_in = models.DecimalField(max_digits=10, decimal_places=2)    # INR
    max_buy_in = models.DecimalField(max_digits=10, decimal_places=2)    # INR
    max_players = models.IntegerField(default=6, choices=MAX_PLAYERS_CHOICES)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tables',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'poker_tables'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} [{self.invite_code}] — BB: ₹{self.big_blind}'


class HandHistory(models.Model):
    """
    Immutable audit ledger of completed hands.
    Written once at showdown, never modified.
    """
    table = models.ForeignKey(PokerTable, on_delete=models.CASCADE, related_name='hand_history')
    hand_number = models.PositiveIntegerField()
    pot_total = models.DecimalField(max_digits=12, decimal_places=2)  # INR
    winners = models.JSONField()
    # Example: [{"user_id": 1, "username": "alice", "amount_won": "1500.00", "hand_rank": "Full House"}]
    community_cards = models.JSONField()
    # Example: ["Ah", "Kd", "7c", "2s", "Jh"]
    player_summary = models.JSONField(default=list)
    # Example: [{"user_id": 1, "hole_cards": ["As", "Kh"], "final_action": "WON"}]
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hand_history'
        unique_together = ('table', 'hand_number')
        ordering = ['hand_number']

    def __str__(self):
        return f'Hand #{self.hand_number} at {self.table.invite_code}'
