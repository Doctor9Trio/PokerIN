"""
Redis state management for active game sessions.
Game state is stored as JSON under key: game_state:{invite_code}
TTL: 24 hours (auto-cleanup of abandoned tables)
"""
import json
import redis
from typing import Optional, Dict
from django.conf import settings

STATE_TTL = 86400  # 24 hours

_memory_state: Dict[str, str] = {}

def _get_redis_client() -> Optional[redis.Redis]:
    try:
        if settings.CHANNEL_LAYERS['default']['BACKEND'] == 'channels.layers.InMemoryChannelLayer':
            return None
        return redis.from_url(
            settings.CHANNEL_LAYERS['default']['CONFIG']['hosts'][0],
            decode_responses=True,
        )
    except Exception:
        return None

def get_state(invite_code: str) -> Optional[Dict]:
    """Load game state from Redis or memory. Returns None if not found."""
    r = _get_redis_client()
    if r:
        try:
            raw = r.get(f'game_state:{invite_code}')
            if raw is None:
                return None
            return json.loads(raw)
        except redis.exceptions.ConnectionError:
            pass
            
    raw = _memory_state.get(invite_code)
    if raw is None:
        return None
    return json.loads(raw)

def save_state(invite_code: str, state: Dict):
    """Persist game state to Redis or memory."""
    r = _get_redis_client()
    raw = json.dumps(state, default=str)
    if r:
        try:
            r.set(f'game_state:{invite_code}', raw, ex=STATE_TTL)
            return
        except redis.exceptions.ConnectionError:
            pass
    _memory_state[invite_code] = raw

def delete_state(invite_code: str):
    """Remove game state (table closed/inactive)."""
    r = _get_redis_client()
    if r:
        try:
            r.delete(f'game_state:{invite_code}')
            return
        except redis.exceptions.ConnectionError:
            pass
    if invite_code in _memory_state:
        del _memory_state[invite_code]

def state_exists(invite_code: str) -> bool:
    r = _get_redis_client()
    if r:
        try:
            return r.exists(f'game_state:{invite_code}') == 1
        except redis.exceptions.ConnectionError:
            pass
    return invite_code in _memory_state
