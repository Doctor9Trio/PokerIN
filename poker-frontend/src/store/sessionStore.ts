import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionState {
  /** Total hands completed this session */
  handsPlayed: number;
  /** Cumulative winnings this session (₹) */
  totalWon: number;
  /** Cumulative losses this session (₹) */
  totalLost: number;
  /** Largest single pot won (₹) */
  biggestPot: number;
  /** When the table session started */
  sessionStartTime: Date | null;

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Record the result of a completed hand.
   * @param profit  Positive = won chips, Negative = lost chips for this hand.
   * @param potSize Total pot size of the hand (to track biggestPot).
   */
  recordHandResult: (profit: number, potSize: number) => void;

  /** Start a fresh session timer (call when entering a table). */
  startSession: () => void;

  /** Reset all session stats (call on disconnect / returning to lobby). */
  resetSession: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>((set) => ({
  handsPlayed: 0,
  totalWon: 0,
  totalLost: 0,
  biggestPot: 0,
  sessionStartTime: null,

  recordHandResult: (profit, potSize) =>
    set((s) => ({
      handsPlayed: s.handsPlayed + 1,
      totalWon: profit > 0 ? s.totalWon + profit : s.totalWon,
      totalLost: profit < 0 ? s.totalLost + Math.abs(profit) : s.totalLost,
      biggestPot: potSize > s.biggestPot ? potSize : s.biggestPot,
    })),

  startSession: () => set({ sessionStartTime: new Date() }),

  resetSession: () =>
    set({
      handsPlayed: 0,
      totalWon: 0,
      totalLost: 0,
      biggestPot: 0,
      sessionStartTime: null,
    }),
}));

// ─── Derived helper ───────────────────────────────────────────────────────────

/** Returns net profit/loss for the session. Positive = profit, negative = loss. */
export function getSessionNetPL(state: SessionState): number {
  return state.totalWon - state.totalLost;
}

/** Returns elapsed session time as a human-readable string, e.g. "1h 24m". */
export function getSessionDuration(startTime: Date | null): string {
  if (!startTime) return '—';
  const diffMs = Date.now() - startTime.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return '< 1m';
}
