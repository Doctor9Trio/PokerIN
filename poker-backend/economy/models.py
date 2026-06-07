from django.db import models
from django.conf import settings

def default_inventory():
    return ["felt_classic", "back_classic", "frame_none"]

class PlayerEconomy(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='economy')
    gold_coins = models.IntegerField(default=200)
    inventory = models.JSONField(default=default_inventory)
    equipped_felt = models.CharField(max_length=50, default="felt_classic")
    equipped_card_back = models.CharField(max_length=50, default="back_classic")
    equipped_avatar_frame = models.CharField(max_length=50, default="frame_none")

    def __str__(self):
        return f"{self.user.username}'s Economy"
