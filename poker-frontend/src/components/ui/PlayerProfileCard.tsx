import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, TrendingUp, Trophy, Coins, ShieldAlert } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerProfileData {
  userId: number;
  username: string;
  /** Current chip balance as a string (decimal), e.g. "12500.00" */
  balance?: string;
  /** Win-rate 0–100, populated when available */
  winRate?: number;
  /** Total hands played */
  handsPlayed?: number;
  /** Total tournaments or sessions */
  biggestPot?: string;
}

interface PlayerProfileCardProps {
  /** The player to display. Null = card is hidden. */
  player: PlayerProfileData | null;
  isVisible: boolean;
  onClose: () => void;
  onReport: (userId: number) => void;
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}

const StatTile: React.FC<StatTileProps> = ({
  icon,
  label,
  value,
  accent = 'text-slate-300',
}) => (
  <div className="
    flex flex-col items-center gap-1.5 p-3 rounded-xl
    bg-surface-card/60 border border-surface-elevated/50
    min-w-0
  ">
    <span className="text-slate-500">{icon}</span>
    <span className={`text-sm font-black font-display ${accent}`}>{value}</span>
    <span className="text-[10px] text-slate-600 font-medium text-center leading-tight">
      {label}
    </span>
  </div>
);

// ─── PlayerProfileCard ────────────────────────────────────────────────────────

export const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({
  player,
  isVisible,
  onClose,
  onReport,
}) => {
  const initial = player?.username.charAt(0).toUpperCase() ?? '?';

  const formatBalance = (b?: string) =>
    b ? `₹${parseFloat(b).toLocaleString('en-IN')}` : '–';

  const formatWinRate = (r?: number) =>
    r !== undefined ? `${r.toFixed(1)}%` : '–';

  return (
    <AnimatePresence>
      {isVisible && player && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="profile-card"
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="
                pointer-events-auto
                relative w-full max-w-xs
                bg-surface/95 backdrop-blur-xl
                border border-surface-elevated/60
                rounded-2xl shadow-2xl overflow-hidden
              "
            >
              {/* Top accent */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

              {/* ── Header ──────────────────────────────────────────────── */}
              <div className="relative px-5 pt-5 pb-4 text-center border-b border-surface-elevated/40">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="
                    absolute top-4 right-4 p-1.5 rounded-lg
                    text-slate-600 hover:text-slate-200 hover:bg-surface-elevated/60
                    transition-colors
                  "
                  aria-label="Close profile"
                >
                  <X size={15} />
                </button>

                {/* Avatar */}
                <div className="relative inline-flex mb-3">
                  <div className="
                    w-16 h-16 rounded-2xl
                    bg-gradient-to-br from-gold/25 to-gold/5
                    border-2 border-gold/35
                    flex items-center justify-center
                    font-display font-black text-2xl text-gold
                    shadow-gold-glow
                  ">
                    {initial}
                  </div>
                  {/* Online indicator */}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neon-green border-2 border-surface" />
                </div>

                <h2 className="font-display text-lg font-black text-slate-100 tracking-tight">
                  {player.username}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">Player #{player.userId}</p>
              </div>

              {/* ── Stats grid ──────────────────────────────────────────── */}
              <div className="px-5 pt-4 pb-3">
                <div className="grid grid-cols-3 gap-2">
                  <StatTile
                    icon={<Coins size={15} />}
                    label="Balance"
                    value={formatBalance(player.balance)}
                    accent="text-gold"
                  />
                  <StatTile
                    icon={<TrendingUp size={15} />}
                    label="Win Rate"
                    value={formatWinRate(player.winRate)}
                    accent="text-neon-green"
                  />
                  <StatTile
                    icon={<Trophy size={15} />}
                    label="Hands"
                    value={
                      player.handsPlayed !== undefined
                        ? player.handsPlayed.toLocaleString()
                        : '–'
                    }
                    accent="text-neon-blue"
                  />
                </div>

                {/* Biggest pot row */}
                {player.biggestPot && (
                  <div className="
                    mt-2 flex items-center justify-between
                    px-3 py-2 rounded-xl
                    bg-surface-card/50 border border-surface-elevated/40
                  ">
                    <span className="text-xs text-slate-500 font-medium">Biggest Pot Won</span>
                    <span className="text-xs font-bold text-gold">
                      {formatBalance(player.biggestPot)}
                    </span>
                  </div>
                )}

                {/* Placeholder stats note */}
                {player.winRate === undefined && (
                  <p className="text-center text-[10px] text-slate-700 mt-2">
                    Full stats available after 10+ hands
                  </p>
                )}
              </div>

              {/* ── Footer actions ───────────────────────────────────────── */}
              <div className="px-5 pb-5 flex flex-col gap-2">
                {/* Report button */}
                <button
                  onClick={() => onReport(player.userId)}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 rounded-xl text-sm font-bold
                    border border-red-500/25 bg-red-500/8
                    text-red-400 hover:bg-red-500/15 hover:border-red-500/40
                    transition-all duration-150
                    group
                  "
                >
                  <ShieldAlert
                    size={14}
                    className="transition-transform group-hover:scale-110"
                  />
                  Report Player
                </button>

                <p className="text-center text-[10px] text-slate-700">
                  Reports are reviewed within 24 hours
                </p>
              </div>

              {/* Bottom accent */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
