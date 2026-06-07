from django.db import models
from django.conf import settings

class PlayerStats(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leaderboard_stats')
    hands_played = models.IntegerField(default=0)
    total_chips = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    win_rate = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.user.username}'s Stats"
