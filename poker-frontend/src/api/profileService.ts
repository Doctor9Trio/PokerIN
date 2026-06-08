import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserStatsData {
  hands_played: number;
  hands_won: number;
  total_winnings: string;
  total_losses: string;
  win_rate: number;
}

export interface WalletData {
  balance: string;
}

export interface MyProfileData {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  wallet: WalletData;
  stats: UserStatsData;
  date_joined: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Fetch the current user's own profile from the server. */
export async function fetchMyProfile(): Promise<MyProfileData> {
  const response = await axios.get<MyProfileData>(`${API_BASE}/api/auth/profile/`, {
    headers: getAuthHeaders(),
    timeout: 8000,
  });
  return response.data;
}

/**
 * Upload a new avatar image.
 * Returns the new avatar URL on success.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await axios.post<{ avatar_url: string; message: string }>(
    `${API_BASE}/api/auth/avatar/`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      timeout: 15000,
    }
  );
  return response.data.avatar_url;
}

/**
 * Change the current user's password.
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  await axios.post(
    `${API_BASE}/api/auth/change-password/`,
    { old_password: oldPassword, new_password: newPassword },
    { headers: getAuthHeaders(), timeout: 8000 }
  );
}

/**
 * Change the current user's username.
 * Returns the new username confirmed by the server.
 */
export async function changeUsername(newUsername: string): Promise<string> {
  const response = await axios.post<{ username: string; message: string }>(
    `${API_BASE}/api/auth/change-username/`,
    { new_username: newUsername },
    { headers: getAuthHeaders(), timeout: 8000 }
  );
  return response.data.username;
}
