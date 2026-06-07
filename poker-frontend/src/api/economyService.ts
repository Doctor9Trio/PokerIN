import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

export interface PlayerEconomyResponse {
  gold_coins: number;
  inventory: string[];
  /** Currently equipped cosmetics returned by GET /api/economy/ */
  equipped?: {
    felt: string;
    cardBack: string;
    avatarFrame: string;
  };
}

export interface PurchaseResponse {
  success: boolean;
  new_balance: number;
  message?: string;
}

export interface AwardCoinsResponse {
  success: boolean;
  new_balance: number;
  message?: string;
}

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const economyService = {
  /**
   * Fetch the user's true goldCoins balance and inventory array from the backend.
   */
  fetchPlayerEconomy: async (): Promise<PlayerEconomyResponse> => {
    const response = await axios.get<PlayerEconomyResponse>(
      `${API_BASE}/api/economy/`,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Securely deduct virtual coins and grant the item in the database.
   */
  processVirtualPurchase: async (itemId: string, cost: number): Promise<PurchaseResponse> => {
    const response = await axios.post<PurchaseResponse>(
      `${API_BASE}/api/economy/purchase/`,
      { item_id: itemId, cost },
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Save the player's active cosmetics so they persist across devices.
   */
  updateEquipped: async (equippedState: Record<string, string>): Promise<{ success: boolean }> => {
    const response = await axios.patch<{ success: boolean }>(
      `${API_BASE}/api/economy/equipped/`,
      { equipped: equippedState },
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Add newly earned virtual coins to the player's backend balance.
   */
  awardGameplayCoins: async (amount: number): Promise<AwardCoinsResponse> => {
    const response = await axios.post<AwardCoinsResponse>(
      `${API_BASE}/api/economy/award/`,
      { amount },
      getAuthHeaders()
    );
    return response.data;
  }
};
