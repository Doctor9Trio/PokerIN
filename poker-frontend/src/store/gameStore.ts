import { create } from 'zustand';
import type { TableState, PlayerState, WinnerInfo, PlayerAction } from '../types/poker';

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  /** Unique ID for stable React keys (timestamp + random suffix) */
  id: string;
  username: string;
  message: string;
  /** ISO timestamp string for display */
  timestamp: string;
  /** True for system events (player joined/left, hand result, etc.) */
  isSystem: boolean;
}

const MAX_CHAT_MESSAGES = 50;

function makeChatId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Action-required payload ──────────────────────────────────────────────────

interface ActionRequired {
  valid_actions: PlayerAction[];
  call_amount: string;
  min_raise: string;
  pot: string;
  timeout_seconds: number;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface GameState {
  tableState: TableState | null;
  myCards: string[];
  actionRequired: ActionRequired | null;
  lastWinners: WinnerInfo[];
  chatMessages: ChatMessage[];
  isConnected: boolean;
  connectionError: string | null;

  setTableState: (state: TableState) => void;
  setMyCards: (cards: string[]) => void;
  setActionRequired: (action: ActionRequired | null) => void;
  setWinners: (winners: WinnerInfo[]) => void;

  /**
   * Primary chat action — accepts a fully typed ChatMessage object.
   * Strictly caps the rolling array at MAX_CHAT_MESSAGES (50).
   */
  addChatMessage: (msg: ChatMessage) => void;

  /**
   * Convenience wrapper kept for backward-compatibility.
   * Creates a player message and delegates to addChatMessage.
   * @deprecated Use addChatMessage directly.
   */
  addChat: (username: string, message: string) => void;

  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  reset: () => void;

  // ── Derived helpers ────────────────────────────────────────────────────────
  getMyPlayer: (userId: number) => PlayerState | undefined;
  isMyTurn: (userId: number) => boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  tableState: null,
  myCards: [],
  actionRequired: null,
  lastWinners: [],
  chatMessages: [],
  isConnected: false,
  connectionError: null,

  setTableState: (state) => set({ tableState: state }),
  setMyCards: (cards) => set({ myCards: cards }),
  setActionRequired: (action) => set({ actionRequired: action }),
  setWinners: (winners) => set({ lastWinners: winners }),

  addChatMessage: (msg) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages.slice(-(MAX_CHAT_MESSAGES - 1)),
        msg,
      ],
    })),

  // Backward-compat shim
  addChat: (username, message) => {
    const msg: ChatMessage = {
      id: makeChatId(),
      username,
      message,
      timestamp: new Date().toISOString(),
      isSystem: false,
    };
    get().addChatMessage(msg);
  },

  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionError: (error) => set({ connectionError: error }),

  reset: () =>
    set({
      tableState: null,
      myCards: [],
      actionRequired: null,
      lastWinners: [],
      chatMessages: [],
      isConnected: false,
      connectionError: null,
    }),

  getMyPlayer: (userId) =>
    get().tableState?.players.find((p) => p.user_id === userId),

  isMyTurn: (userId) => {
    const state = get().tableState;
    const me = state?.players.find((p) => p.user_id === userId);
    return state?.current_turn === me?.seat_index;
  },
}));
