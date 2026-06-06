import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModalName = 'SETTINGS' | 'DISCONNECT_ALERT' | 'BUY_IN' | null;

export interface UISettings {
  audioEnabled: boolean;
  fourColorDeck: boolean;
  lowGraphicsMode: boolean;
}

interface UIState {
  // Modal
  activeModal: ModalName;

  // Loading overlay
  isLoading: boolean;
  loadingMessage: string;

  // App-wide settings
  settings: UISettings;

  // ── Actions ────────────────────────────────────────────────────────────────
  openModal: (name: NonNullable<ModalName>) => void;
  closeModal: () => void;
  setLoading: (status: boolean, msg?: string) => void;
  updateSetting: (key: keyof UISettings, value: boolean) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useUIStore = create<UIState>((set) => ({
  // ── Initial State ──────────────────────────────────────────────────────────
  activeModal: null,

  isLoading: false,
  loadingMessage: 'Loading…',

  settings: {
    audioEnabled: true,
    fourColorDeck: false,
    lowGraphicsMode: false,
  },

  // ── Modal Actions ──────────────────────────────────────────────────────────
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),

  // ── Loading Actions ────────────────────────────────────────────────────────
  setLoading: (status, msg = 'Loading…') =>
    set({ isLoading: status, loadingMessage: msg }),

  // ── Settings Actions ───────────────────────────────────────────────────────
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
}));
