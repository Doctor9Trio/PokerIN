from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from users.models import UserStats


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return top 100 players ranked by total winnings.

        Reads from users.UserStats which is updated after every hand settles
        in game/consumers.py (_settle_hand). The old leaderboard.PlayerStats
        table was never written to and has been bypassed here.
        """
        stats_qs = (
            UserStats.objects
            .select_related('user', 'user__wallet')
            .order_by('-total_winnings')[:100]
        )

        results = []
        for index, stat in enumerate(stats_qs, start=1):
            wallet_balance = '0.00'
            try:
                wallet_balance = str(stat.user.wallet.balance)
            except Exception:
                pass

            results.append({
                'rank': index,
                'username': stat.user.username,
                'total_chips': wallet_balance,
                'win_rate': stat.win_rate,
                'hands_played': stat.hands_played,
                'hands_won': stat.hands_won,
                'total_winnings': str(stat.total_winnings),
                'total_losses': str(stat.total_losses),
                'avatar_url': request.build_absolute_uri(stat.user.avatar.url) if stat.user.avatar else None,
            })

        return Response({
            'results': results,
            'computed_at': timezone.now().isoformat(),
        })
