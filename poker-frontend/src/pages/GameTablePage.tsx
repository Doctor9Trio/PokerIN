import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Coins } from 'lucide-react';
import { PokerTable } from '../components/table/PokerTable';
import { TableChat } from '../components/game/TableChat';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useSessionStore } from '../store/sessionStore';
import type { PlayerAction } from '../types/poker';

// ─── Buy-In Modal ─────────────────────────────────────────────────────────────
// Extracted to keep GameTablePage JSX clean and avoid z-index nesting issues.

interface BuyInModalProps {
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const BuyInModal: React.FC<BuyInModalProps> = ({ onClose, onConfirm }) => {
  const [amount, setAmount] = useState('1000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val > 0) onConfirm(val);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Card */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="
            pointer-events-auto w-full max-w-xs
            bg-surface/95 backdrop-blur-xl
            border border-surface-elevated/60
            rounded-2xl shadow-2xl overflow-hidden
          "
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-elevated/40">
            <div className="flex items-center gap-2.5">
              <Coins size={16} className="text-gold" />
              <h2 className="font-display font-bold text-slate-100 text-base">Buy In to Play</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-elevated/60 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Amount (₹)
              </label>
              <input
                id="buy-in-amount-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="100"
                step="100"
                required
                className="
                  w-full rounded-xl px-4 py-2.5 text-sm outline-none
                  bg-surface-card border border-surface-elevated
                  text-slate-200 placeholder-slate-600
                  focus:border-gold/50 focus:ring-2 focus:ring-gold/10
                  transition-all
                "
              />
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {['500', '1000', '2000', '5000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`
                    py-1.5 rounded-lg text-xs font-bold border transition-all
                    ${amount === preset
                      ? 'bg-gold/15 border-gold/35 text-gold'
                      : 'bg-surface-card border-surface-elevated text-slate-500 hover:text-slate-300'
                    }
                  `}
                >
                  {parseInt(preset).toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <button
              id="btn-confirm-buyin"
              type="submit"
              className="
                w-full py-2.5 rounded-xl font-bold text-sm
                bg-gold hover:bg-gold-light
                text-surface transition-colors
              "
            >
              Join Table →
            </button>
          </form>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
        </motion.div>
      </div>
    </>
  );
};

// ─── GameTablePage ────────────────────────────────────────────────────────────

export const GameTablePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { userId, token } = useAuthStore();
  const {
    tableState,
    myCards,
    actionRequired,
    connectionError,
    isConnected,
    reset,
  } = useGameStore();

  // Extract sendChat from the hook alongside send
  const { send, sendChat, disconnect } = useWebSocket(inviteCode || null);

  const { openModal } = useUIStore();
  const { startSession } = useSessionStore();

  const hasBoughtIn = React.useRef(false);
  const [showBuyInModal, setShowBuyInModal] = useState(false);

  // ── Auto buy-in on first connect ──────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || hasBoughtIn.current) return;
    const buyInParam = searchParams.get('buyin');
    if (buyInParam) {
      send({ type: 'BUY_IN', amount: parseFloat(buyInParam) });
      hasBoughtIn.current = true;
    }
  }, [isConnected, searchParams, send]);

  // ── Show buy-in modal if stack is 0 after join ────────────────────────────
  useEffect(() => {
    if (isConnected && tableState && !hasBoughtIn.current) {
      const myPlayer = tableState.players.find((p) => p.user_id === userId);
      if (myPlayer && parseFloat(myPlayer.stack) === 0) {
        setShowBuyInModal(true);
      }
    }
  }, [isConnected, tableState, userId]);

  // ── Start session timer on mount ─────────────────────────────────────────
  useEffect(() => {
    startSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnect();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = (action: PlayerAction, amount?: number) => {
    send({ type: 'PLAYER_ACTION', action, ...(amount !== undefined && { amount }) });
  };

  const handleLeave = () => {
    // Disconnect the socket immediately so no more events come in,
    // then show the session summary — navigation happens from inside the modal.
    disconnect();
    openModal('SESSION_SUMMARY');
  };

  const handleBuyInConfirm = (amount: number) => {
    send({ type: 'BUY_IN', amount });
    hasBoughtIn.current = true;
    setShowBuyInModal(false);
  };

  // Redirect if token vanished (e.g. storage cleared)
  if (!token) {
    navigate('/');
    return null;
  }

  return (
    /*
     * Root: full-screen dark felt canvas.
     * Layout: flex row — PokerTable fills the left (flex-1),
     * TableChat occupies a fixed-width right rail.
     * The chat rail sits ABOVE the table (z-10) but BELOW modals (z-50+),
     * so it never occludes the timer rings or card animations.
     */
    <div className="w-screen h-screen overflow-hidden flex bg-felt relative">

      {/* ── Connection overlay (initial loading spinner) ─────────────────── */}
      <AnimatePresence>
        {!isConnected && !connectionError && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-felt/95 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="text-5xl text-gold select-none"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                ♠
              </motion.div>
              <p className="text-sm text-slate-500 font-medium">Connecting to table…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Connection error banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {connectionError && (
          <motion.div
            key="conn-error"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="
              fixed top-0 left-0 right-0 z-[60]
              py-2 text-center text-xs font-semibold
              bg-red-500/90 text-white backdrop-blur-sm
            "
          >
            {connectionError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Poker table canvas (flex-1) ──────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {tableState ? (
          <PokerTable
            tableState={tableState}
            myUserId={userId!}
            myCards={myCards}
            actionRequired={actionRequired}
            onAction={handleAction}
            onReady={() => send({ type: 'READY' })}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Loading table state…
          </div>
        )}
      </div>

      {/* ── Right rail: Chat sidebar ─────────────────────────────────────── */}
      <div className="
        relative z-10 flex-shrink-0
        w-64 flex flex-col
        border-l border-surface-elevated/40
        bg-felt/80 backdrop-blur-sm
        p-3 gap-3
      ">
        {/* Table meta pill */}
        {tableState && (
          <div className="
            flex flex-wrap items-center justify-center gap-x-3 gap-y-1
            px-3 py-2 rounded-xl
            bg-surface/60 border border-surface-elevated/50
            text-[10px] font-medium text-slate-500
          ">
            <span className="text-gold font-bold">#{tableState.table_id}</span>
            <span>Hand #{tableState.hand_number}</span>
            <span>BB ₹{tableState.big_blind}</span>
            <span className={
              tableState.game_stage === 'WAITING'
                ? 'text-slate-600'
                : 'text-neon-green font-semibold'
            }>
              {tableState.game_stage.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Chat — fills remaining vertical space */}
        <div className="flex-1 min-h-0">
          <TableChat onSendMessage={sendChat} />
        </div>

        {/* ── Bottom action buttons ──────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <button
            id="btn-open-buyin"
            onClick={() => setShowBuyInModal(true)}
            className="
              w-full py-2 rounded-xl text-xs font-bold
              bg-gold/10 border border-gold/25 text-gold
              hover:bg-gold/20 hover:border-gold/40
              transition-all duration-150
            "
          >
            + Buy In
          </button>
          <button
            id="btn-leave-table"
            onClick={handleLeave}
            className="
              w-full flex items-center justify-center gap-1.5
              py-2 rounded-xl text-xs font-bold
              bg-red-500/10 border border-red-500/20 text-red-400
              hover:bg-red-500/20 hover:border-red-500/35
              transition-all duration-150
            "
          >
            <LogOut size={12} />
            Leave Table
          </button>
        </div>
      </div>

      {/* ── Buy-In Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBuyInModal && (
          <BuyInModal
            onClose={() => setShowBuyInModal(false)}
            onConfirm={handleBuyInConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
