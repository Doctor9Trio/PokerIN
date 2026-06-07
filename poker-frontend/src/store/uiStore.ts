import { create } from 'zustand';
import type { PlayerProfileData } from '../components/ui/PlayerProfileCard';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalName =
  | 'SETTINGS'
  | 'DISCONNECT_ALERT'
  | 'BUY_IN'
  | 'PLAYER_PROFILE'
  | 'SESSION_SUMMARY'
  | 'LEADERBOARD'
  | 'TUTORIAL'
  | 'STOREFRONT'
  | null;

export interface UISettings {
  audioEnabled: boolean;
  fourColorDeck: boolean;
  lowGraphicsMode: boolean;
}

interface UIState {
  // ── Modal ──────────────────────────────────────────────────────────────────
  activeModal: ModalName;

  /**
   * Typed payload for PLAYER_PROFILE modal.
   * Null when no profile is selected.
   */
  selectedPlayer: PlayerProfileData | null;

  // ── Loading overlay ────────────────────────────────────────────────────────
  isLoading: boolean;
  loadingMessage: string;

  // ── App-wide settings ──────────────────────────────────────────────────────
  settings: UISettings;

  // ── Actions ────────────────────────────────────────────────────────────────
  openModal: (name: NonNullable<ModalName>) => void;
  closeModal: () => void;

  /** Shortcut: opens PLAYER_PROFILE modal and sets the selected player. */
  openPlayerProfile: (player: PlayerProfileData) => void;

  setLoading: (status: boolean, msg?: string) => void;
  updateSetting: (key: keyof UISettings, value: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUIStore = create<UIState>((set) => ({
  // ── Initial State ──────────────────────────────────────────────────────────
  activeModal: null,
  selectedPlayer: null,

  isLoading: false,
  loadingMessage: 'Loading…',

  settings: {
    audioEnabled: true,
    fourColorDeck: false,
    lowGraphicsMode: false,
  },

  // ── Modal Actions ──────────────────────────────────────────────────────────
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null, selectedPlayer: null }),

  openPlayerProfile: (player) =>
    set({ activeModal: 'PLAYER_PROFILE', selectedPlayer: player }),

  // ── Loading Actions ────────────────────────────────────────────────────────
  setLoading: (status, msg = 'Loading…') =>
    set({ isLoading: status, loadingMessage: msg }),

  // ── Settings Actions ───────────────────────────────────────────────────────
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
}));
