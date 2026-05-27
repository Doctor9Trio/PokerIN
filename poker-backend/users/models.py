from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended user with unique email constraint."""
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username


class Wallet(models.Model):
    """
    Player wallet — INR balance tracked with DecimalField to prevent
    floating-point errors. All transactions must use SERIALIZABLE isolation.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=10000.00,  # Starting balance: ₹10,000
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallets'

    def __str__(self):
        return f'{self.user.username} — ₹{self.balance}'

    def can_afford(self, amount) -> bool:
        """Check if player has sufficient balance."""
        return self.balance >= amount

    def deduct(self, amount):
        """Atomically deduct amount. Raises ValueError if insufficient funds."""
        if not self.can_afford(amount):
            raise ValueError(
                f'Insufficient balance. Available: ₹{self.balance}, Required: ₹{amount}'
            )
        self.balance -= amount
        self.save(update_fields=['balance', 'updated_at'])

    def credit(self, amount):
        """Credit winnings to wallet."""
        self.balance += amount
        self.save(update_fields=['balance', 'updated_at'])


class UserStats(models.Model):
    """Read-only aggregate statistics per player."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    hands_played = models.PositiveIntegerField(default=0)
    hands_won = models.PositiveIntegerField(default=0)
    total_winnings = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_losses = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = 'user_stats'

    @property
    def win_rate(self) -> float:
        if self.hands_played == 0:
            return 0.0
        return round((self.hands_won / self.hands_played) * 100, 2)

    def __str__(self):
        return f'{self.user.username} stats'
