import json
import redis
from decimal import Decimal
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PokerTable
from .serializers import CreateTableSerializer, TableInfoSerializer


def _get_redis():
    return redis.from_url(settings.CHANNEL_LAYERS['default']['CONFIG']['hosts'][0])


def _get_active_seat_count(invite_code: str) -> int:
    """Count connected players from Redis game state."""
    try:
        r = _get_redis()
        state_raw = r.get(f'game_state:{invite_code}')
        if not state_raw:
            return 0
        state = json.loads(state_raw)
        return len([p for p in state.get('players', []) if p.get('is_connected')])
    except Exception:
        return 0


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_table(request):
    """Create a new poker table. Returns the generated invite code."""
    serializer = CreateTableSerializer(data=request.data)
    if serializer.is_valid():
        table = serializer.save(created_by=request.user)
        return Response(
            {
                'invite_code': table.invite_code,
                'table': TableInfoSerializer(table).data,
                'message': f'Table created! Share invite code: {table.invite_code}',
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_table(request):
    """
    Validate invite code, check seat availability,
    and verify the player has enough balance to cover the minimum buy-in.
    """
    invite_code = request.data.get('invite_code', '').strip().upper()
    buy_in_amount = request.data.get('buy_in_amount')

    if not invite_code:
        return Response({'error': 'Invite code is required.'}, status=400)

    try:
        table = PokerTable.objects.get(invite_code=invite_code, is_active=True)
    except PokerTable.DoesNotExist:
        return Response({'error': 'Invalid or inactive table code.'}, status=404)

    # Check seat availability
    active_seats = _get_active_seat_count(invite_code)
    if active_seats >= table.max_players:
        return Response({'error': 'Table is full.'}, status=400)

    # Validate buy-in amount
    if buy_in_amount is None:
        return Response({'error': 'buy_in_amount is required.'}, status=400)

    buy_in = Decimal(str(buy_in_amount))
    if buy_in < table.min_buy_in:
        return Response(
            {'error': f'Minimum buy-in is ₹{table.min_buy_in}.'},
            status=400,
        )
    if buy_in > table.max_buy_in:
        return Response(
            {'error': f'Maximum buy-in is ₹{table.max_buy_in}.'},
            status=400,
        )

    # Check player balance
    wallet = request.user.wallet
    if not wallet.can_afford(buy_in):
        return Response(
            {
                'error': f'Insufficient balance. You have ₹{wallet.balance}, '
                         f'need ₹{buy_in}.'
            },
            status=400,
        )

    return Response(
        {
            'table': TableInfoSerializer(table).data,
            'buy_in_amount': str(buy_in),
            'message': 'Approved. Connect via WebSocket to take your seat.',
            'ws_url': f'ws://localhost:8000/ws/table/{invite_code}/',
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def table_info(request, invite_code):
    """Fetch table metadata for lobby display."""
    try:
        table = PokerTable.objects.get(invite_code=invite_code.upper(), is_active=True)
    except PokerTable.DoesNotExist:
        return Response({'error': 'Table not found.'}, status=404)

    active_seats = _get_active_seat_count(invite_code.upper())
    data = TableInfoSerializer(table).data
    data['active_players'] = active_seats
    data['available_seats'] = table.max_players - active_seats
    return Response(data)
