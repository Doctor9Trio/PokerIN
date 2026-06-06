import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ChatMessage } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { playSound } from '../audio/audioManager';
import type { ServerMessage } from '../types/poker';

const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000`;
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

function makeChatId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useWebSocket(inviteCode: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { token } = useAuthStore();
  const {
    setTableState,
    setMyCards,
    setActionRequired,
    setWinners,
    addChatMessage,
    setConnected,
    setConnectionError,
  } = useGameStore();

  const connect = useCallback(() => {
    if (!inviteCode || !token) return;

    const url = `${WS_BASE}/ws/table/${inviteCode}/?token=${token}`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setConnectionError(null);
      reconnectCount.current = 0;

      // Inject a system message on (re)connect
      const sysMsg: ChatMessage = {
        id: makeChatId(),
        username: 'System',
        message: 'Connected to table.',
        timestamp: new Date().toISOString(),
        isSystem: true,
      };
      addChatMessage(sysMsg);
    };

    socket.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'TABLE_STATE_UPDATE':
          setTableState(msg.state);
          break;

        case 'RECEIVE_PRIVATE_CARDS':
          setMyCards(msg.cards);
          playSound('card_deal');
          break;

        case 'ACTION_REQUIRED':
          setActionRequired(msg);
          break;

        case 'HAND_RESULT':
          setWinners(msg.winners);
          playSound('pot_win');
          setActionRequired(null);
          if (msg.players) {
            const currentState = useGameStore.getState().tableState;
            if (currentState) {
              const newPlayers = currentState.players.map((p) => {
                const updatedP = msg.players.find(
                  (mp: any) => mp.seat_index === p.seat_index
                );
                if (updatedP && updatedP.hole_cards && updatedP.hole_cards.length > 0) {
                  return { ...p, hole_cards: updatedP.hole_cards };
                }
                return p;
              });
              setTableState({ ...currentState, players: newPlayers });
            }
          }
          break;

        case 'PLAYER_JOINED': {
          const joinMsg: ChatMessage = {
            id: makeChatId(),
            username: 'System',
            message: `${msg.username} joined the table.`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          };
          addChatMessage(joinMsg);
          break;
        }

        case 'PLAYER_LEFT': {
          const leftMsg: ChatMessage = {
            id: makeChatId(),
            username: 'System',
            message: `${msg.username} left the table.`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          };
          addChatMessage(leftMsg);
          break;
        }

        case 'CHAT_MESSAGE': {
          const chatMsg: ChatMessage = {
            id: makeChatId(),
            username: msg.username,
            message: msg.message,
            timestamp: new Date().toISOString(),
            isSystem: false,
          };
          addChatMessage(chatMsg);
          break;
        }

        case 'ERROR':
          console.error('[Poker WS Error]', msg.message);
          // Surface as a system chat message instead of a blocking alert
          addChatMessage({
            id: makeChatId(),
            username: 'System',
            message: `⚠ ${msg.message}`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          });
          break;
      }
    };

    socket.onclose = (event) => {
      setConnected(false);
      ws.current = null;

      if (event.code !== 1000 && reconnectCount.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectCount.current++;
        setConnectionError(`Reconnecting... (attempt ${reconnectCount.current})`);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      } else if (event.code === 4001) {
        setConnectionError('Authentication failed. Please log in again.');
      } else {
        setConnectionError('Connection lost.');
      }
    };

    socket.onerror = () => {
      setConnectionError('WebSocket error. Check your connection.');
    };
  }, [inviteCode, token]);

  // ── Generic send ────────────────────────────────────────────────────────────
  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  // ── Chat emitter ─────────────────────────────────────────────────────────────
  /**
   * Sends a SEND_CHAT_MESSAGE event to the server.
   * The server will broadcast it back as a CHAT_MESSAGE to all table members.
   */
  const sendChat = useCallback(
    (message: string) => {
      send({ type: 'SEND_CHAT_MESSAGE', message: message.trim() });
    },
    [send]
  );

  // ── Disconnect ───────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    ws.current?.close(1000, 'Player left table');
    ws.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    send,
    sendChat,
    disconnect,
    isConnected: useGameStore((s) => s.isConnected),
  };
}
