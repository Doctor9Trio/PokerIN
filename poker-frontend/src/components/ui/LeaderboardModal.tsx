import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, TrendingUp, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import {
  fetchLeaderboard,
  normaliseTotalChips,
} from '../../api/leaderboardService';
import type { LeaderboardEntry } from '../../api/leaderboardService';

// ─── Rank medal config ────────────────────────────────────────────────────────

const RANK_CONFIG: Record<number, { ring: string; text: string; bg: string; label: string }> = {
  1: { ring: 'border-gold',      text: 'text-gold',      bg: 'bg-gold/8',       label: '🥇' },
  2: { ring: 'border-slate-400', text: 'text-slate-300', bg: 'bg-slate-400/6',  label: '🥈' },
  3: { ring: 'border-amber-700', text: 'text-amber-600', bg: 'bg-amber-900/10', label: '🥉' },
};

// ─── Skeleton loader row ──────────────────────────────────────────────────────

const SkeletonRow: React.FC<{ index: number }> = ({ index }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center gap-3 px-4 py-3 rounded-xl"
  >
    {/* Rank placeholder */}
    <div className="w-8 flex justify-center flex-shrink-0">
      <div className="w-5 h-4 rounded bg-surface-elevated/60 animate-pulse" />
    </div>
    {/* Avatar circle */}
    <div className="w-8 h-8 rounded-full bg-surface-elevated/60 animate-pulse flex-shrink-0" />
    {/* Name + hands block */}
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 w-28 rounded bg-surface-elevated/60 animate-pulse" />
      <div className="h-2.5 w-16 rounded bg-surface-elevated/40 animate-pulse" />
    </div>
    {/* Win rate block */}
    <div className="space-y-1.5 text-right flex-shrink-0">
      <div className="h-3.5 w-10 rounded bg-surface-elevated/60 animate-pulse ml-auto" />
      <div className="h-2.5 w-12 rounded bg-surface-elevated/40 animate-pulse ml-auto" />
    </div>
    {/* Chips block */}
    <div className="w-20 space-y-1.5 text-right flex-shrink-0">
      <div className="h-3.5 w-14 rounded bg-surface-elevated/60 animate-pulse ml-auto" />
      <div className="h-2.5 w-8 rounded bg-surface-elevated/40 animate-pulse ml-auto" />
    </div>
  </motion.div>
);

// ─── Data row ─────────────────────────────────────────────────────────────────

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry; index: number }> = ({
  entry,
  index,
}) => {
  const cfg = RANK_CONFIG[entry.rank];
  const isTop3 = entry.rank <= 3;
  const chipsNum = normaliseTotalChips(entry);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl
        border transition-colors
        ${isTop3
          ? `${cfg.bg} ${cfg.ring}`
          : 'border-transparent hover:bg-surface-elevated/20 hover:border-surface-elevated/40'
        }
      `}
    >
      {/* Rank */}
      <div className={`w-8 text-center flex-shrink-0 ${isTop3 ? 'text-xl' : ''}`}>
        {isTop3 ? (
          <span>{cfg.label}</span>
        ) : (
          <span className="text-xs font-bold text-slate-600">#{entry.rank}</span>
        )}
      </div>

      {/* Avatar initial */}
      <div className={`
        w-8 h-8 rounded-full flex-shrink-0
        flex items-center justify-center text-xs font-black
        ${isTop3
          ? `border-2 ${cfg.ring} ${cfg.text} bg-surface-card`
          : 'bg-surface-card text-slate-500 border border-surface-elevated'
        }
      `}>
        {entry.username.charAt(0).toUpperCase()}
      </div>

      {/* Username + hands played */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isTop3 ? cfg.text : 'text-slate-300'}`}>
          {entry.username}
        </p>
        <p className="text-[10px] text-slate-600">
          {entry.hands_played.toLocaleString('en-IN')} hands
        </p>
      </div>

      {/* Win rate */}
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <TrendingUp size={10} className={isTop3 ? cfg.text : 'text-slate-600'} />
          <span className={`text-xs font-bold ${isTop3 ? cfg.text : 'text-slate-400'}`}>
            {entry.win_rate.toFixed(1)}%
          </span>
        </div>
        <p className="text-[10px] text-slate-600">win rate</p>
      </div>

      {/* Chip count */}
      <div className="text-right flex-shrink-0 w-20">
        <p className={`text-sm font-black font-display ${isTop3 ? cfg.text : 'text-slate-300'}`}>
          {chipsNum >= 1_000_000
            ? `₹${(chipsNum / 1_000_000).toFixed(1)}M`
            : `₹${(chipsNum / 1000).toFixed(0)}K`
          }
        </p>
        <p className="text-[10px] text-slate-600">chips</p>
      </div>
    </motion.div>
  );
};

// ─── Error state ──────────────────────────────────────────────────────────────

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-12 gap-4 px-6">
    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
      {message.toLowerCase().includes('network') || message.toLowerCase().includes('connect')
        ? <WifiOff size={22} className="text-red-400" />
        : <AlertCircle size={22} className="text-red-400" />
      }
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-slate-300">Could not load leaderboard</p>
      <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xs">{message}</p>
    </div>
    <button
      onClick={onRetry}
      className="
        flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
        bg-gold/10 border border-gold/25 text-gold
        hover:bg-gold/20 transition-colors
      "
    >
      <RefreshCw size={12} />
      Try Again
    </button>
  </div>
);

// ─── LeaderboardModal ─────────────────────────────────────────────────────────

export const LeaderboardModal: React.FC = () => {
  const { closeModal } = useUIStore();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [computedAt, setComputedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const data = await fetchLeaderboard();
      setEntries(data);
      setError(null);
      setComputedAt(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      }));
    } catch (err: any) {
      // Normalise the error into a user-facing message
      const isNetworkError =
        !err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED';

      setError(
        isNetworkError
          ? 'Network error. Check your connection and try again.'
          : err.response?.data?.detail ||
            err.message ||
            'An unexpected error occurred.'
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => loadData(true);

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="px-3 py-2 space-y-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} index={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return <ErrorState message={error} onRetry={() => loadData(false)} />;
    }

    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <Trophy size={32} className="text-slate-700" />
          <p className="text-sm text-slate-500">No entries yet</p>
          <p className="text-xs text-slate-700">Play a hand to appear on the leaderboard!</p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto flex-1 px-3 py-2 space-y-0.5">
        <AnimatePresence>
          {entries.map((entry, i) => (
            <LeaderboardRow key={entry.rank} entry={entry} index={i} />
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="
            pointer-events-auto w-full max-w-md
            bg-surface/96 backdrop-blur-xl
            border border-surface-elevated/60
            rounded-2xl shadow-2xl overflow-hidden
            flex flex-col max-h-[90vh]
          "
        >
          {/* Gold top accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-elevated/40 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Trophy size={18} className="text-gold" />
              <div>
                <h2 className="font-display font-bold text-slate-100 text-base leading-tight">
                  Global Leaderboard
                </h2>
                <p className="text-[10px] text-slate-600">Top players by total chips</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading || refreshing}
                title="Refresh leaderboard"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-surface-elevated/50 transition-colors disabled:opacity-40"
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={refreshing
                    ? { duration: 0.7, repeat: Infinity, ease: 'linear' }
                    : { duration: 0.3 }
                  }
                >
                  <RefreshCw size={14} />
                </motion.div>
              </button>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-elevated/60 transition-colors"
                aria-label="Close leaderboard"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Column headers — only show when data is loaded */}
          {!isLoading && !error && entries.length > 0 && (
            <div className="flex items-center gap-3 px-5 py-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wider border-b border-surface-elevated/30 flex-shrink-0">
              <div className="w-8 text-center">#</div>
              <div className="w-8" />
              <div className="flex-1">Player</div>
              <div className="w-16 text-right">Win Rate</div>
              <div className="w-20 text-right">Chips</div>
            </div>
          )}

          {/* Body (loading / error / data) */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {renderBody()}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-surface-elevated/30 flex-shrink-0">
            <p className="text-center text-[10px] text-slate-700">
              {computedAt
                ? `⏱ Last updated ${computedAt} · Updated every 15 minutes`
                : '🔄 Fetching live data…'
              }
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent flex-shrink-0" />
        </motion.div>
      </div>
    </>
  );
};
