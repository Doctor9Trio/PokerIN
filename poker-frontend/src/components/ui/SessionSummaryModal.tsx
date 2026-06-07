import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Hash, Trophy, LogOut, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useSessionStore, getSessionNetPL, getSessionDuration } from '../../store/sessionStore';
import { useGameStore } from '../../store/gameStore';

// ─── Stat card tile ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  bgAccent?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  sub,
  accent = 'text-slate-200',
  bgAccent = 'bg-surface-card/60',
}) => (
  <div className={`flex flex-col gap-2 p-4 rounded-xl border border-surface-elevated/50 ${bgAccent}`}>
    <div className={`${accent} opacity-70`}>{icon}</div>
    <div>
      <p className={`text-xl font-black font-display ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
    <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{label}</p>
  </div>
);

// ─── SessionSummaryModal ──────────────────────────────────────────────────────

export const SessionSummaryModal: React.FC = () => {
  const { closeModal } = useUIStore();
  const session = useSessionStore();
  const { reset: resetGame } = useGameStore();
  const navigate = useNavigate();

  const netPL = getSessionNetPL(session);
  const duration = getSessionDuration(session.sessionStartTime);
  const isProfit = netPL >= 0;

  const formatINR = (v: number) =>
    `${v >= 0 ? '+' : '−'}₹${Math.abs(v).toLocaleString('en-IN')}`;

  const handleReturnToLobby = () => {
    resetGame();
    session.resetSession();
    closeModal();
    navigate('/lobby');
  };

  const handlePlayAgain = () => {
    resetGame();
    session.resetSession();
    closeModal();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 32 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="
            pointer-events-auto w-full max-w-sm
            bg-surface/96 backdrop-blur-xl
            border border-surface-elevated/60
            rounded-2xl shadow-2xl overflow-hidden
          "
        >
          {/* Top accent */}
          <div className={`h-1 w-full ${isProfit ? 'bg-gradient-to-r from-emerald-500/60 via-emerald-400 to-emerald-500/60' : 'bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60'}`} />

          {/* Hero net P&L */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-surface-elevated/40">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 ${isProfit ? 'bg-emerald-500/12' : 'bg-red-500/12'}`}>
              {isProfit
                ? <TrendingUp size={26} className="text-emerald-400" />
                : <TrendingDown size={26} className="text-red-400" />
              }
            </div>

            <h2 className="font-display text-lg font-black text-slate-100 mb-1">
              Session Complete
            </h2>

            <motion.p
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
              className={`text-4xl font-black font-display tracking-tight ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {formatINR(netPL)}
            </motion.p>
            <p className="text-xs text-slate-600 mt-1">Net profit / loss this session</p>
          </div>

          {/* Stats grid */}
          <div className="px-5 py-4 grid grid-cols-3 gap-2">
            <StatCard
              icon={<Hash size={15} />}
              label="Hands"
              value={String(session.handsPlayed)}
              accent="text-neon-blue"
              bgAccent="bg-blue-500/5"
            />
            <StatCard
              icon={<Clock size={15} />}
              label="Duration"
              value={duration}
              accent="text-slate-300"
            />
            <StatCard
              icon={<Trophy size={15} />}
              label="Biggest Pot"
              value={session.biggestPot > 0 ? `₹${session.biggestPot.toLocaleString('en-IN')}` : '—'}
              accent="text-gold"
              bgAccent="bg-gold/5"
            />
          </div>

          {/* Won / Lost breakdown */}
          <div className="px-5 pb-4 flex gap-2">
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <span className="text-xs text-slate-500">Won</span>
              <span className="text-xs font-bold text-emerald-400">
                +₹{session.totalWon.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/15">
              <span className="text-xs text-slate-500">Lost</span>
              <span className="text-xs font-bold text-red-400">
                −₹{session.totalLost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 pb-5 flex flex-col gap-2">
            <button
              id="btn-return-to-lobby"
              onClick={handleReturnToLobby}
              className="
                w-full flex items-center justify-center gap-2
                py-3 rounded-xl font-bold text-sm
                bg-gold hover:bg-gold-light
                text-surface transition-colors
              "
            >
              <LogOut size={15} />
              Return to Lobby
            </button>
            <button
              onClick={handlePlayAgain}
              className="
                w-full flex items-center justify-center gap-2
                py-2.5 rounded-xl text-sm font-semibold
                border border-surface-elevated text-slate-400
                hover:text-slate-200 hover:border-surface-elevated/80
                transition-colors
              "
            >
              <RotateCcw size={13} />
              Stay at Table
            </button>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
        </motion.div>
      </div>
    </>
  );
};
