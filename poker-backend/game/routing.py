"""
WebSocket URL routing for game consumers.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/table/(?P<invite_code>[A-Z0-9]{6})/$', consumers.PokerConsumer.as_asgi()),
]
