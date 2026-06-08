import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single row in the leaderboard response.
 * These field names must match what Django returns from GET /api/leaderboard/
 */
export interface LeaderboardEntry {
  /** Server-computed rank (1-based) */
  rank: number;
  username: string;
  /** Current wallet balance as a numeric string, e.g. "12500.00" */
  total_chips: string;
  /** Win-rate 0–100, e.g. 61.4 */
  win_rate: number;
  /** Total hands the player has participated in */
  hands_played: number;
  /** Hands won */
  hands_won: number;
  /** Cumulative chips won across all hands */
  total_winnings: string;
  /** Cumulative chips lost */
  total_losses: string;
  /** Player's uploaded avatar URL, or null */
  avatar_url: string | null;
}

export interface LeaderboardResponse {
  results: LeaderboardEntry[];
  /** ISO timestamp of when the snapshot was computed */
  computed_at: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

/**
 * Reads the JWT token from the auth store at call-time (not cached on module
 * load). This guarantees we always use the current token even if the user
 * logged in or refreshed their token after the module was first imported.
 *
 * Returns an axios headers object, or an empty object if no token is present.
 */
function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  if (!token) {
    console.warn('[leaderboardService] No auth token found — request will be rejected with 401.');
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Fetches the global leaderboard from the backend.
 *
 * Endpoint: GET /api/leaderboard/
 * Auth: Required — Django backend uses IsAuthenticated permission class.
 * Expected response: LeaderboardResponse
 *
 * Falls back gracefully: callers should handle the thrown error.
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await axios.get<LeaderboardResponse>(
    `${API_BASE}/api/leaderboard/`,
    {
      headers: getAuthHeaders(), // dynamically read token at request time
      timeout: 8000,             // 8-second hard timeout
    }
  );

  // Validate that the expected shape exists
  if (!Array.isArray(response.data?.results)) {
    throw new Error('Unexpected leaderboard response shape from server.');
  }

  return response.data.results;
}

/**
 * Normalises a LeaderboardEntry from the server into the shape
 * the UI components expect, with numeric total_chips coerced.
 */
export function normaliseTotalChips(entry: LeaderboardEntry): number {
  return parseFloat(entry.total_chips) || 0;
}
