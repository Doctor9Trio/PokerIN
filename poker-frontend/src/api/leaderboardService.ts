import axios from 'axios';

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
  /** Total chip balance as a numeric string, e.g. "284500.00" */
  total_chips: string;
  /** Win-rate 0–100, e.g. 61.4 */
  win_rate: number;
  /** Total hands the player has participated in */
  hands_played: number;
}

export interface LeaderboardResponse {
  results: LeaderboardEntry[];
  /** ISO timestamp of when the snapshot was computed */
  computed_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Fetches the global leaderboard from the backend.
 *
 * Endpoint: GET /api/leaderboard/
 * Auth: Not required (public endpoint).
 * Expected response: LeaderboardResponse
 *
 * Falls back gracefully: callers should handle the thrown error.
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await axios.get<LeaderboardResponse>(
    `${API_BASE}/api/leaderboard/`,
    {
      timeout: 8000, // 8-second hard timeout
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
