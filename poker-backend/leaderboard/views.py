from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import PlayerStats

class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Query top PlayerStats ordered by total_chips descending
        # In a production app, we would paginate this. For now, slice top 100.
        stats = PlayerStats.objects.select_related('user').order_by('-total_chips')[:100]
        
        results = []
        for index, stat in enumerate(stats, start=1):
            results.append({
                "rank": index,
                "username": stat.user.username,
                "total_chips": str(stat.total_chips),
                "win_rate": stat.win_rate,
                "hands_played": stat.hands_played
            })

        return Response({
            "results": results,
            "computed_at": timezone.now().isoformat()
        })
