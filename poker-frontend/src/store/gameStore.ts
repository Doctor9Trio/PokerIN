import { create } from 'zustand';
import type { TableState, PlayerState, WinnerInfo, PlayerAction } from '../types/poker';

interface ActionRequired {
  valid_actions: PlayerAction[];
  call_amount: string;
  min_raise: string;
  pot: string;
  timeout_seconds: number;
}

interface GameState {
  tableState: TableState | null;
  myCards: string[];
  actionRequired: ActionRequired | null;
  lastWinners: WinnerInfo[];
  chatMessages: Array<{ username: string; message: string; timestamp: number }>;
  isConnected: boolean;
  connectionError: string | null;

  setTableState: (state: TableState) => void;
  setMyCards: (cards: string[]) => void;
  setActionRequired: (action: ActionRequired | null) => void;
  setWinners: (winners: WinnerInfo[]) => void;
  addChat: (username: string, message: string) => void;
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  reset: () => void;

  // Derived helpers
  getMyPlayer: (userId: number) => PlayerState | undefined;
  isMyTurn: (userId: number) => boolean;
}

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
  addChat: (username, message) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages.slice(-49), // Keep last 50 messages
        { username, message, timestamp: Date.now() },
      ],
    })),
  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionError: (error) => set({ connectionError: error }),
  reset: () => set({
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
