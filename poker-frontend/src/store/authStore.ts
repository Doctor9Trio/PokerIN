import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userId: number | null;
  username: string | null;
  balance: string | null;
  setAuth: (data: { access: string; refresh: string; user_id: number; username: string }) => void;
  setBalance: (balance: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      userId: null,
      username: null,
      balance: null,

      setAuth: (data) => set({
        token: data.access,
        refreshToken: data.refresh,
        userId: data.user_id,
        username: data.username,
      }),

      setBalance: (balance) => set({ balance }),

      logout: () => set({
        token: null,
        refreshToken: null,
        userId: null,
        username: null,
        balance: null,
      }),
    }),
    { name: 'poker-auth' }
  )
);
