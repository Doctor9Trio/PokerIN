# PokerIN — Real-Time Multiplayer Texas Hold'em

A full-stack poker application with Django + Channels backend and Vite + React (TypeScript) frontend.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis (for channel layer + game state)
- PostgreSQL (optional — SQLite used by default for local dev)

---

### Backend Setup

```bash
cd poker-backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env as needed (SQLite is used by default — no DB config required for local dev)

# Run migrations
python manage.py migrate

# Start development server (HTTP + WebSocket via Daphne)
python manage.py runserver
```

The backend will be available at `http://localhost:8000`.

---

### Frontend Setup

```bash
cd poker-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create account (starts with ₹10,000) |
| POST | `/api/auth/login/` | Get JWT access + refresh tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET | `/api/auth/profile/` | Current balance and stats |
| POST | `/api/tables/create/` | Create a poker table |
| POST | `/api/tables/join/` | Validate invite code and buy-in |
| GET | `/api/tables/{code}/info/` | Table metadata |

## WebSocket

Connect to: `ws://localhost:8000/ws/table/{INVITE_CODE}/?token={JWT_ACCESS_TOKEN}`

### Client → Server Messages
```json
{ "type": "BUY_IN", "amount": 5000 }
{ "type": "PLAYER_ACTION", "action": "RAISE", "amount": 500 }
{ "type": "PLAYER_ACTION", "action": "FOLD" }
{ "type": "PLAYER_ACTION", "action": "CALL" }
{ "type": "PLAYER_ACTION", "action": "CHECK" }
{ "type": "PLAYER_ACTION", "action": "ALL_IN" }
{ "type": "CHAT_MESSAGE", "message": "Good game!" }
```

### Server → Client Messages
```json
{ "type": "TABLE_STATE_UPDATE", "state": { ... } }
{ "type": "RECEIVE_PRIVATE_CARDS", "cards": ["As", "Kh"] }
{ "type": "ACTION_REQUIRED", "valid_actions": [...], "call_amount": "100", ... }
{ "type": "HAND_RESULT", "winners": [...], "community_cards": [...] }
{ "type": "PLAYER_JOINED", "username": "...", "seat_index": 0 }
{ "type": "ERROR", "message": "..." }
```

## Architecture

```
poker-frontend/          Vite + React + TypeScript
├── src/
│   ├── pages/           AuthPage, LobbyPage, GameTablePage
│   ├── components/
│   │   ├── table/       PokerTable, PlayerSeat, CommunityCards
│   │   ├── controls/    ActionConsole, TimerRing
│   │   └── shared/      PlayingCard, ChipStack
│   ├── store/           Zustand (authStore, gameStore)
│   ├── hooks/           useWebSocket (auto-reconnect)
│   └── audio/           Howler.js sprite manager

poker-backend/           Django + Channels + Daphne
├── users/               Auth, Wallet (INR DecimalField), Stats
├── tables/              PokerTable, HandHistory
└── game/
    ├── engine.py        Texas Hold'em state machine
    ├── consumers.py     WebSocket consumer (PokerConsumer)
    ├── state_manager.py Redis get/save/delete
    └── middleware.py    JWT WebSocket auth
```

## Running Tests

```bash
cd poker-backend
python manage.py test game.tests --verbosity=2
# 10/10 tests pass
```

## Production Notes

- Replace `USE_SQLITE=True` with PostgreSQL credentials in `.env`
- Start Redis: `redis-server`
- Use Daphne for WebSocket traffic: `daphne poker_backend.asgi:application`
- Serve frontend with Vercel/Netlify (static export of `dist/`)
- Add audio sprites to `poker-frontend/public/audio/poker-sprites.webm`
