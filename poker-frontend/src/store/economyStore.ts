import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Catalogue definitions ────────────────────────────────────────────────────
// These are the source-of-truth IDs. Any new cosmetic must be added here.

export type FeltId =
  | 'felt_classic'    // Default — deep green
  | 'felt_midnight'   // Deep navy blue
  | 'felt_ruby'       // Deep crimson
  | 'felt_obsidian'   // Near-black with subtle purple
  | 'felt_emerald'    // Vibrant jewel green
  | 'felt_gold';      // Rich amber/gold

export type CardBackId =
  | 'back_classic'    // Default — dark diagonal hatch
  | 'back_dragon'     // Dark red with diamond grid
  | 'back_cosmos'     // Deep blue with star dots
  | 'back_carbon'     // Dark carbon-fibre weave
  | 'back_royal';     // Gold diamond lattice

export type AvatarFrameId =
  | 'frame_none'      // Default — no special frame
  | 'frame_gold'      // Gold ring
  | 'frame_diamond'   // Animated diamond shimmer
  | 'frame_flame';    // Ember glow

export type CosmeticCategory = 'felt' | 'cardBack' | 'avatarFrame';

// ─── Equipped state ───────────────────────────────────────────────────────────

export interface EquippedCosmetics {
  felt: FeltId;
  cardBack: CardBackId;
  avatarFrame: AvatarFrameId;
}

// ─── Chip pack definitions ────────────────────────────────────────────────────

export interface ChipPack {
  id: string;
  label: string;
  chips: number;
  goldCost: number;
  bonus?: string;
}

export const CHIP_PACKS: ChipPack[] = [
  { id: 'chips_starter', label: 'Starter Pack',   chips:  5_000, goldCost: 50  },
  { id: 'chips_mid',     label: 'Mid-Roller Pack', chips: 15_000, goldCost: 130, bonus: '+1K bonus' },
  { id: 'chips_high',    label: 'High-Roller Pack',chips: 50_000, goldCost: 400, bonus: '+5K bonus' },
  { id: 'chips_whale',   label: 'Whale Pack',      chips:150_000, goldCost: 999, bonus: '+20K bonus' },
];

// ─── Cosmetic catalogue ───────────────────────────────────────────────────────

export interface CosmeticItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  goldCost: number;
  /** Tailwind class(es) used for the preview swatch */
  previewClass: string;
  /** true = always owned, cannot be purchased */
  isDefault: boolean;
}

export const COSMETIC_CATALOGUE: CosmeticItem[] = [
  // ── Felts ───────────────────────────────────────────────────────────────────
  { id: 'felt_classic',  category: 'felt', name: 'Classic Green',  description: 'The timeless poker table.',      goldCost: 0,   previewClass: 'bg-gradient-to-br from-emerald-900 to-emerald-950', isDefault: true  },
  { id: 'felt_midnight', category: 'felt', name: 'Midnight',       description: 'Deep navy blue elegance.',       goldCost: 80,  previewClass: 'bg-gradient-to-br from-blue-900 to-slate-950',       isDefault: false },
  { id: 'felt_ruby',     category: 'felt', name: 'Ruby Red',       description: 'Bold crimson high-stakes feel.', goldCost: 80,  previewClass: 'bg-gradient-to-br from-red-900 to-red-950',          isDefault: false },
  { id: 'felt_obsidian', category: 'felt', name: 'Obsidian',       description: 'Dark luxury with purple tones.', goldCost: 150, previewClass: 'bg-gradient-to-br from-purple-950 to-slate-950',     isDefault: false },
  { id: 'felt_emerald',  category: 'felt', name: 'Jewel Emerald',  description: 'Vibrant jewel-tone green.',      goldCost: 150, previewClass: 'bg-gradient-to-br from-emerald-600 to-emerald-900',  isDefault: false },
  { id: 'felt_gold',     category: 'felt', name: 'Gold Rush',      description: 'Exclusive amber luxury table.',  goldCost: 300, previewClass: 'bg-gradient-to-br from-yellow-700 to-amber-900',     isDefault: false },

  // ── Card Backs ───────────────────────────────────────────────────────────────
  { id: 'back_classic', category: 'cardBack', name: 'Classic',    description: 'Clean diagonal hatch pattern.',  goldCost: 0,   previewClass: 'bg-gradient-to-br from-slate-700 to-slate-900', isDefault: true  },
  { id: 'back_dragon',  category: 'cardBack', name: 'Dragon',     description: 'Fire-red diamond lattice.',      goldCost: 100, previewClass: 'bg-gradient-to-br from-red-800 to-red-950',    isDefault: false },
  { id: 'back_cosmos',  category: 'cardBack', name: 'Cosmos',     description: 'Starfield deep space design.',   goldCost: 100, previewClass: 'bg-gradient-to-br from-indigo-900 to-blue-950', isDefault: false },
  { id: 'back_carbon',  category: 'cardBack', name: 'Carbon',     description: 'Premium carbon-fibre weave.',    goldCost: 200, previewClass: 'bg-gradient-to-br from-zinc-700 to-zinc-950',   isDefault: false },
  { id: 'back_royal',   category: 'cardBack', name: 'Royal Gold', description: 'Gilded diamond lattice.',        goldCost: 350, previewClass: 'bg-gradient-to-br from-yellow-600 to-amber-800', isDefault: false },

  // ── Avatar Frames ─────────────────────────────────────────────────────────────
  { id: 'frame_none',    category: 'avatarFrame', name: 'None',         description: 'Default style.',               goldCost: 0,   previewClass: 'bg-slate-800 border-slate-600',       isDefault: true  },
  { id: 'frame_gold',    category: 'avatarFrame', name: 'Gold Ring',    description: 'Solid gold avatar border.',    goldCost: 120, previewClass: 'bg-slate-800 border-yellow-400',      isDefault: false },
  { id: 'frame_diamond', category: 'avatarFrame', name: 'Diamond',      description: 'Prismatic shimmering ring.',   goldCost: 250, previewClass: 'bg-slate-800 border-cyan-300',        isDefault: false },
  { id: 'frame_flame',   category: 'avatarFrame', name: 'Ember Flame',  description: 'Fiery glow effect.',           goldCost: 350, previewClass: 'bg-slate-800 border-orange-500',      isDefault: false },
];

// ─── Store interface ──────────────────────────────────────────────────────────

interface EconomyState {
  /** Premium currency balance (Gold Coins) */
  premiumCurrency: number;

  /** Owned cosmetic IDs (always includes all defaults) */
  inventory: string[];

  /** Currently equipped cosmetics per category */
  equipped: EquippedCosmetics;

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Equip an already-owned item.
   * Only succeeds if itemId is in inventory.
   */
  equipItem: (category: CosmeticCategory, itemId: string) => void;

  /**
   * Purchase an item from the catalogue with Gold Coins.
   * Deducts cost, adds to inventory, and auto-equips it.
   * Returns false if insufficient funds or already owned.
   */
  purchaseItem: (itemId: string, cost: number) => boolean;

  /** Add Gold Coins (e.g. from chip packs or bonuses) */
  addCurrency: (amount: number) => void;

  /** Debug helper: reset to defaults */
  resetEconomy: () => void;
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_INVENTORY = COSMETIC_CATALOGUE
  .filter((c) => c.isDefault)
  .map((c) => c.id);

const DEFAULT_EQUIPPED: EquippedCosmetics = {
  felt: 'felt_classic',
  cardBack: 'back_classic',
  avatarFrame: 'frame_none',
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEconomyStore = create<EconomyState>()(
  persist(
    (set, get) => ({
      premiumCurrency: 200, // Starting bonus
      inventory: DEFAULT_INVENTORY,
      equipped: DEFAULT_EQUIPPED,

      equipItem: (category, itemId) => {
        if (!get().inventory.includes(itemId)) return;
        set((s) => ({
          equipped: { ...s.equipped, [category]: itemId },
        }));
      },

      purchaseItem: (itemId, cost) => {
        const s = get();
        if (s.inventory.includes(itemId)) return false;   // already owned
        if (s.premiumCurrency < cost) return false;        // insufficient funds
        set({
          premiumCurrency: s.premiumCurrency - cost,
          inventory: [...s.inventory, itemId],
        });
        // Determine category from catalogue, then auto-equip
        const item = COSMETIC_CATALOGUE.find((c) => c.id === itemId);
        if (item) {
          set((s) => ({
            equipped: { ...s.equipped, [item.category]: itemId },
          }));
        }
        return true;
      },

      addCurrency: (amount) =>
        set((s) => ({ premiumCurrency: s.premiumCurrency + amount })),

      resetEconomy: () =>
        set({
          premiumCurrency: 200,
          inventory: DEFAULT_INVENTORY,
          equipped: DEFAULT_EQUIPPED,
        }),
    }),
    {
      name: 'poker-economy',   // localStorage key
      // Only persist the parts that need to survive a page reload
      partialize: (s) => ({
        premiumCurrency: s.premiumCurrency,
        inventory: s.inventory,
        equipped: s.equipped,
      }),
    }
  )
);
