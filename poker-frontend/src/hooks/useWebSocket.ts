import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ChatMessage } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { useEconomyStore } from '../store/economyStore';
import { economyService } from '../api/economyService';
import { playSound } from '../audio/audioManager';
import type { SoundKey } from '../audio/audioManager';
import type { ServerMessage } from '../types/poker';

/**
 * Stagger a repeated sound across `count` slots, each separated by `delayMs`.
 * e.g. playStaggered('card_deal', 3, 80) fires at 0 ms, 80 ms, 160 ms.
 * Each individual call goes through the playSound throttle guard, so
 * back-to-back stagger windows cannot overlap dangerously.
 */
function playStaggered(soundKey: SoundKey, count: number, delayMs = 80): void {
  for (let i = 0; i < count; i++) {
    setTimeout(() => playSound(soundKey), i * delayMs);
  }
}

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
  /**
   * Tracks server-assigned message IDs that have already been rendered.
   * Prevents the double-render caused by a reconnect firing the same
   * broadcast twice (once per socket instance) or React Strict Mode's
   * double-effect invocation in development.
   * Bounded to 200 entries to keep memory constant.
   */
  const processedMsgIds = useRef<Set<string>>(new Set());

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
        case 'TABLE_STATE_UPDATE': {
          // ── Community-card staggered audio ─────────────────────────────────
          // Compare the incoming board length against the current snapshot to
          // determine whether this update is a Flop (3 cards), Turn (1), or
          // River (1) and stagger the deal sounds accordingly.
          const prevBoard = useGameStore.getState().tableState?.board ?? [];
          const nextBoard = msg.state?.board ?? [];
          const newCardCount = nextBoard.length - prevBoard.length;
          if (newCardCount > 0) {
            playStaggered('card_deal', newCardCount);
          }

          setTableState(msg.state);
          break;
        }

        case 'RECEIVE_PRIVATE_CARDS':
          setMyCards(msg.cards);
          // Stagger one sound per hole card (always 2 for Texas Hold'em)
          playStaggered('card_deal', msg.cards?.length ?? 2);
          break;

        case 'ACTION_REQUIRED':
          setActionRequired(msg);
          playSound('your_turn');
          break;

        case 'PLAYER_ACTION':
          if (msg.action) {
            const actionKey = msg.action.toLowerCase();
            if (actionKey === 'check' || actionKey === 'fold') {
              playSound(actionKey as any);
            } else if (actionKey === 'call' || actionKey === 'raise' || actionKey === 'all_in') {
              playSound('chip_bet');
            }
          }
          break;

        case 'HAND_RESULT': {
          setWinners(msg.winners);
          playSound('pot_win');
          setActionRequired(null);

          // ── Session P&L accounting ────────────────────────────────────────
          // Use getState() so we never add a hook subscription inside a callback.
          const myUserId = useAuthStore.getState().userId;
          const tableStateSnapshot = useGameStore.getState().tableState;

          if (myUserId !== null && tableStateSnapshot) {
            // Total pot = sum of all amounts won by winners this hand
            const potSize = msg.winners.reduce(
              (acc: number, w: { amount_won: string }) =>
                acc + parseFloat(w.amount_won),
              0
            );

            // What the current user bet this street (their chips at risk)
            const myPlayerSnapshot = tableStateSnapshot.players.find(
              (p) => p.user_id === myUserId
            );
            const myBet = myPlayerSnapshot
              ? parseFloat(myPlayerSnapshot.current_bet)
              : 0;

            // What the current user won (0 if they didn't win)
            const myWinEntry = msg.winners.find(
              (w: { user_id: number }) => w.user_id === myUserId
            );
            const amountWon = myWinEntry ? parseFloat(myWinEntry.amount_won) : 0;

            // Net = winnings minus what was at risk.
            // If they won the pot: amountWon - myBet (positive profit).
            // If they folded / lost: 0 - myBet (negative, i.e. a loss).
            const netProfit = amountWon - myBet;

            // Fire-and-forget — no re-render triggered on the table
            useSessionStore.getState().recordHandResult(netProfit, potSize);

            // ── Phase 5.1: Award Gameplay Coins ─────────────────────────────
            if (netProfit > 0) {
              const coinsEarned = Math.floor(netProfit * 0.05); // 5% of profit as Gold Coins
              if (coinsEarned > 0) {
                economyService.awardGameplayCoins(coinsEarned)
                  .then((res) => {
                    if (res.success) {
                       useEconomyStore.setState({ premiumCurrency: res.new_balance });
                    }
                  })
                  .catch(console.error);
              }
            }
          }

          // ── Reveal hole cards on showdown ─────────────────────────────────
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
        }

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
          // ── Deduplication guard ─────────────────────────────────────────────
          // The server echoes CHAT_MESSAGE to every group member including the
          // sender. On reconnect (or in React Strict Mode dev double-mount) the
          // same broadcast can arrive on two socket instances simultaneously.
          // We use a server-assigned `id` field when present, falling back to
          // a content hash so every message is processed at most once.
          const serverId: string | undefined = (msg as any).id;
          const dedupeKey = serverId ?? `${msg.username}:${msg.message}`;

          if (processedMsgIds.current.has(dedupeKey)) {
            break; // already rendered — silently drop
          }
          // Bound the Set to prevent unbounded memory growth
          if (processedMsgIds.current.size >= 200) {
            const firstKey = processedMsgIds.current.values().next().value;
            processedMsgIds.current.delete(firstKey);
          }
          processedMsgIds.current.add(dedupeKey);

          const chatMsg: ChatMessage = {
            id: serverId ?? makeChatId(),
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
      // Consumer router maps 'CHAT_MESSAGE' → handle_chat (NOT 'SEND_CHAT_MESSAGE')
      send({ type: 'CHAT_MESSAGE', message: message.trim() });
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
    // Capture the socket inside the effect so the cleanup closes THIS instance,
    // not whatever ws.current points to at cleanup time (which may be a newer
    // reconnected socket). This is the root cause of the duplicate-listener bug.
    connect();
    const capturedSocket = ws.current;
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      capturedSocket?.close(1000, 'Component unmounted');
      if (ws.current === capturedSocket) {
        ws.current = null;
      }
    };
  }, [connect]);

  return {
    send,
    sendChat,
    disconnect,
    isConnected: useGameStore((s) => s.isConnected),
  };
}
