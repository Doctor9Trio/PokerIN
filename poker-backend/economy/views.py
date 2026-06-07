import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from .models import PlayerEconomy

logger = logging.getLogger(__name__)


class EconomyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        economy, created = PlayerEconomy.objects.get_or_create(user=request.user)
        logger.debug('[Economy GET] user=%s gold=%s inventory=%s equipped=(%s/%s/%s)',
                     request.user, economy.gold_coins, economy.inventory,
                     economy.equipped_felt, economy.equipped_card_back, economy.equipped_avatar_frame)
        return Response({
            "gold_coins": economy.gold_coins,
            "inventory": economy.inventory,
            "equipped": {
                "felt":        economy.equipped_felt,
                "cardBack":    economy.equipped_card_back,
                "avatarFrame": economy.equipped_avatar_frame,
            }
        })


class PurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        item_id = request.data.get('item_id')
        raw_cost = request.data.get('cost')

        logger.debug('[Purchase] user=%s item_id=%r raw_cost=%r', request.user, item_id, raw_cost)

        # ── Validate payload ────────────────────────────────────────────────────
        if not item_id or raw_cost is None:
            logger.warning('[Purchase] 400 — Missing item_id or cost. data=%r', request.data)
            return Response({"detail": "Missing item_id or cost"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Safely coerce cost to int — frontend may send int or float
        try:
            cost = int(float(raw_cost))
        except (TypeError, ValueError):
            logger.warning('[Purchase] 400 — Invalid cost value: %r', raw_cost)
            return Response({"detail": f"Invalid cost value: {raw_cost!r}"},
                            status=status.HTTP_400_BAD_REQUEST)

        if cost < 0:
            logger.warning('[Purchase] 400 — Negative cost: %d', cost)
            return Response({"detail": "Cost cannot be negative"},
                            status=status.HTTP_400_BAD_REQUEST)

        # ── Lock row & validate balance / ownership ──────────────────────────────
        economy, _ = PlayerEconomy.objects.select_for_update().get_or_create(user=request.user)

        if item_id in economy.inventory:
            logger.warning('[Purchase] 400 — Item already owned: %s for user=%s', item_id, request.user)
            return Response({"detail": "Item already owned"},
                            status=status.HTTP_400_BAD_REQUEST)

        if economy.gold_coins < cost:
            logger.warning('[Purchase] 400 — Insufficient coins: have=%d need=%d user=%s',
                           economy.gold_coins, cost, request.user)
            return Response({"detail": "Insufficient gold coins"},
                            status=status.HTTP_400_BAD_REQUEST)

        # ── Commit purchase ─────────────────────────────────────────────────────
        economy.gold_coins -= cost
        economy.inventory = economy.inventory + [item_id]   # new list to avoid JSONField mutation gotcha
        economy.save()

        logger.info('[Purchase] SUCCESS user=%s item=%s new_balance=%d', request.user, item_id, economy.gold_coins)
        return Response({
            "success": True,
            "new_balance": economy.gold_coins,
            "message": "Purchase successful",
        })


class EquippedView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        equipped_payload = request.data.get('equipped', {})

        logger.debug('[Equip] user=%s payload=%r', request.user, equipped_payload)

        if not equipped_payload:
            logger.warning('[Equip] 400 — Empty equipped payload from user=%s', request.user)
            return Response({"detail": "No equipped data provided"},
                            status=status.HTTP_400_BAD_REQUEST)

        economy, _ = PlayerEconomy.objects.get_or_create(user=request.user)

        # ── Validate each item is in the player's inventory ─────────────────────
        for key, item_id in equipped_payload.items():
            if item_id not in economy.inventory:
                logger.warning('[Equip] 400 — item %r not in inventory for user=%s', item_id, request.user)
                return Response(
                    {"detail": f"Item '{item_id}' is not in your inventory"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ── Apply changes ───────────────────────────────────────────────────────
        if 'felt' in equipped_payload:
            economy.equipped_felt = equipped_payload['felt']
        if 'cardBack' in equipped_payload:
            economy.equipped_card_back = equipped_payload['cardBack']
        if 'avatarFrame' in equipped_payload:
            economy.equipped_avatar_frame = equipped_payload['avatarFrame']

        economy.save()
        logger.info('[Equip] SUCCESS user=%s felt=%s cardBack=%s avatarFrame=%s',
                    request.user, economy.equipped_felt, economy.equipped_card_back,
                    economy.equipped_avatar_frame)
        return Response({"success": True})


class AwardCoinsView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        raw_amount = request.data.get('amount')
        logger.debug('[Award] user=%s raw_amount=%r', request.user, raw_amount)

        try:
            amount = int(float(raw_amount))
        except (TypeError, ValueError):
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({"detail": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)

        economy, _ = PlayerEconomy.objects.select_for_update().get_or_create(user=request.user)
        economy.gold_coins += amount
        economy.save()

        logger.info('[Award] user=%s +%d coins → balance=%d', request.user, amount, economy.gold_coins)
        return Response({
            "success": True,
            "new_balance": economy.gold_coins,
            "message": f"Awarded {amount} coins",
        })
