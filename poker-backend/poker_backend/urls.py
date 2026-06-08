"""
Root URL configuration.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from economy.views import EconomyView, PurchaseView, EquippedView, AwardCoinsView
from leaderboard.views import LeaderboardView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/tables/', include('tables.urls')),

    path('api/economy/', EconomyView.as_view(), name='economy'),
    path('api/economy/purchase/', PurchaseView.as_view(), name='economy-purchase'),
    path('api/economy/equipped/', EquippedView.as_view(), name='economy-equipped'),
    path('api/economy/award/', AwardCoinsView.as_view(), name='economy-award'),

    path('api/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
