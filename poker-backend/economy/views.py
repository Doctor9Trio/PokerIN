from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from .models import PlayerEconomy

class EconomyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        economy, created = PlayerEconomy.objects.get_or_create(user=request.user)
        return Response({
            "gold_coins": economy.gold_coins,
            "inventory": economy.inventory,
            "equipped": {
                "felt": economy.equipped_felt,
                "cardBack": economy.equipped_card_back,
                "avatarFrame": economy.equipped_avatar_frame
            }
        })

class PurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        item_id = request.data.get('item_id')
        cost = request.data.get('cost')

        if not item_id or cost is None:
            return Response({"detail": "Missing item_id or cost"}, status=status.HTTP_400_BAD_REQUEST)

        # Lock the row for update to prevent race conditions
        economy, created = PlayerEconomy.objects.select_for_update().get_or_create(user=request.user)

        if item_id in economy.inventory:
            return Response({"detail": "Item already owned"}, status=status.HTTP_400_BAD_REQUEST)

        if economy.gold_coins < int(cost):
            return Response({"detail": "Insufficient gold coins"}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct cost and add to inventory
        economy.gold_coins -= int(cost)
        economy.inventory.append(item_id)
        economy.save()

        return Response({
            "success": True,
            "new_balance": economy.gold_coins,
            "message": "Purchase successful"
        })

class EquippedView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        equipped = request.data.get('equipped', {})
        economy, created = PlayerEconomy.objects.get_or_create(user=request.user)

        if 'felt' in equipped:
            economy.equipped_felt = equipped['felt']
        if 'cardBack' in equipped:
            economy.equipped_card_back = equipped['cardBack']
        if 'avatarFrame' in equipped:
            economy.equipped_avatar_frame = equipped['avatarFrame']

        economy.save()
        return Response({"success": True})

class AwardCoinsView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        amount = request.data.get('amount')
        if amount is None or int(amount) <= 0:
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        # Lock the row to prevent race conditions when awarding coins rapidly
        economy, created = PlayerEconomy.objects.select_for_update().get_or_create(user=request.user)
        economy.gold_coins += int(amount)
        economy.save()

        return Response({
            "success": True,
            "new_balance": economy.gold_coins,
            "message": f"Awarded {amount} coins"
        })
