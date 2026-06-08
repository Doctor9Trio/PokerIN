import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  WifiOff,
  Settings,
  Volume2,
  VolumeX,
  Layers,
  KeyRound,
  AtSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { PlayerProfileCard } from './PlayerProfileCard';
import { SessionSummaryModal } from './SessionSummaryModal';
import { LeaderboardModal } from './LeaderboardModal';
import { TutorialModal } from './TutorialModal';
import { StorefrontModal } from './StorefrontModal';
import { MyProfileModal } from './MyProfileModal';
import { changePassword, changeUsername } from '../../api/profileService';
import { fetchLeaderboard } from '../../api/leaderboardService';
import type { PlayerProfileData } from './PlayerProfileCard';

// ─── Backdrop ─────────────────────────────────────────────────────────────────

const Backdrop: React.FC<{ onClose?: () => void }> = ({ onClose }) => (
  <motion.div
    key="backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  />
);

// ─── Modal Shell ──────────────────────────────────────────────────────────────

interface ModalShellProps {
  title: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
  /** Prevent backdrop click from closing */
  persistent?: boolean;
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  icon,
  onClose,
  children,
  persistent = false,
}) => (
  <>
    <Backdrop onClose={persistent ? undefined : onClose} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="
          pointer-events-auto
          relative w-full max-w-md
          bg-surface/95 backdrop-blur-xl
          border border-surface-elevated/60
          rounded-2xl shadow-2xl overflow-hidden
        "
      >
        {/* Decorative top accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-elevated/40">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="text-gold">{icon}</span>
            )}
            <h2 className="text-base font-bold text-slate-100 font-display tracking-wide">
              {title}
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-elevated/60 transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Decorative bottom accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </motion.div>
    </div>
  </>
);

// ─── Inline Feedback Badge ────────────────────────────────────────────────────

interface FeedbackProps {
  type: 'success' | 'error';
  message: string;
}

const Feedback: React.FC<FeedbackProps> = ({ type, message }) => (
  <motion.div
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
      type === 'success'
        ? 'bg-neon-green/10 border border-neon-green/25 text-neon-green'
        : 'bg-red-500/10 border border-red-500/20 text-red-400'
    }`}
  >
    {type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
    {message}
  </motion.div>
);

// ─── Collapsible Account Section ──────────────────────────────────────────────

interface AccountSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const AccountSection: React.FC<AccountSectionProps> = ({ title, icon, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-surface-elevated/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          w-full flex items-center justify-between
          px-4 py-3
          text-sm font-semibold text-slate-300
          hover:bg-surface-elevated/30 transition-colors
        "
      >
        <span className="flex items-center gap-2.5">
          <span className="text-gold">{icon}</span>
          {title}
        </span>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-surface-elevated/40">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Settings Modal ───────────────────────────────────────────────────────────

const SettingsModal: React.FC = () => {
  const { closeModal, settings, updateSetting } = useUIStore();
  const { setUsername } = useAuthStore();

  // ── Password change state ────────────────────────────────────────────────
  const [pwdOld, setPwdOld] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<FeedbackProps | null>(null);

  // ── Username change state ────────────────────────────────────────────────
  const [newUsername, setNewUsername] = useState('');
  const [unLoading, setUnLoading] = useState(false);
  const [unFeedback, setUnFeedback] = useState<FeedbackProps | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdOld || !pwdNew) return;
    setPwdLoading(true);
    setPwdFeedback(null);
    try {
      await changePassword(pwdOld, pwdNew);
      setPwdFeedback({ type: 'success', message: 'Password changed successfully!' });
      setPwdOld('');
      setPwdNew('');
    } catch (err: any) {
      const data = err.response?.data;
      const msg =
        typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : 'Failed to change password.';
      setPwdFeedback({ type: 'error', message: msg });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setUnLoading(true);
    setUnFeedback(null);
    try {
      const confirmed = await changeUsername(newUsername.trim());
      setUsername(confirmed);
      setNewUsername('');
      setUnFeedback({ type: 'success', message: `Username changed to "${confirmed}"` });
    } catch (err: any) {
      const data = err.response?.data;
      const msg =
        typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : 'Failed to change username.';
      setUnFeedback({ type: 'error', message: msg });
    } finally {
      setUnLoading(false);
    }
  };

  const toggleRows: Array<{
    key: keyof typeof settings;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'audioEnabled',
      label: 'Sound Effects',
      description: 'Chips, cards, and game audio',
      icon: settings.audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />,
    },
    {
      key: 'fourColorDeck',
      label: 'Four-Color Deck',
      description: 'Unique color per suit for accessibility',
      icon: <Layers size={18} />,
    },
    {
      key: 'lowGraphicsMode',
      label: 'Low Graphics Mode',
      description: 'Disable animations for performance',
      icon: <Settings size={18} />,
    },
  ];

  const inputCls = `
    w-full rounded-xl px-3 py-2 text-sm outline-none
    bg-surface-card border border-surface-elevated
    text-slate-200 placeholder-slate-600
    focus:border-gold/50 focus:ring-2 focus:ring-gold/10
    transition-all duration-150
  `;

  return (
    <ModalShell
      title="Settings"
      icon={<Settings size={18} />}
      onClose={closeModal}
    >
      <div className="flex flex-col gap-3">
        {/* ── Appearance toggles ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          {toggleRows.map(({ key, label, description, icon }) => (
            <button
              key={key}
              onClick={() => updateSetting(key, !settings[key])}
              className="
                group flex items-center justify-between
                w-full px-4 py-3.5 rounded-xl
                border border-transparent
                hover:border-surface-elevated/60 hover:bg-surface-elevated/30
                transition-all duration-150 text-left
              "
            >
              <div className="flex items-center gap-3">
                <span
                  className={`transition-colors ${
                    settings[key] ? 'text-gold' : 'text-slate-500'
                  }`}
                >
                  {icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
              </div>

              {/* Toggle pill */}
              <div
                className={`
                  relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                  ${settings[key] ? 'bg-gold/80' : 'bg-surface-elevated'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                    transition-transform duration-200
                    ${settings[key] ? 'translate-x-5' : 'translate-x-0.5'}
                  `}
                />
              </div>
            </button>
          ))}
        </div>

        {/* ── Account management ─────────────────────────────────────────── */}
        <div className="border-t border-surface-elevated/40 pt-3 flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-1 mb-1">
            Account
          </p>

          {/* Change Username */}
          <AccountSection title="Change Username" icon={<AtSign size={15} />}>
            <form onSubmit={handleUsernameChange} className="flex flex-col gap-3 mt-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="New username"
                minLength={3}
                maxLength={30}
                className={inputCls}
                disabled={unLoading}
              />
              <AnimatePresence>
                {unFeedback && <Feedback {...unFeedback} />}
              </AnimatePresence>
              <button
                type="submit"
                disabled={unLoading || newUsername.trim().length < 3}
                className="
                  flex items-center justify-center gap-2
                  w-full py-2.5 rounded-xl text-sm font-bold
                  bg-gold/15 border border-gold/30 text-gold
                  hover:bg-gold/25 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                {unLoading ? <Loader2 size={14} className="animate-spin" /> : <AtSign size={14} />}
                {unLoading ? 'Saving…' : 'Update Username'}
              </button>
            </form>
          </AccountSection>

          {/* Change Password */}
          <AccountSection title="Change Password" icon={<KeyRound size={15} />}>
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-3 mt-2">
              <input
                type="password"
                value={pwdOld}
                onChange={(e) => setPwdOld(e.target.value)}
                placeholder="Current password"
                className={inputCls}
                disabled={pwdLoading}
                autoComplete="current-password"
              />
              <input
                type="password"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                placeholder="New password (min 8 chars)"
                minLength={8}
                className={inputCls}
                disabled={pwdLoading}
                autoComplete="new-password"
              />
              <AnimatePresence>
                {pwdFeedback && <Feedback {...pwdFeedback} />}
              </AnimatePresence>
              <button
                type="submit"
                disabled={pwdLoading || !pwdOld || pwdNew.length < 8}
                className="
                  flex items-center justify-center gap-2
                  w-full py-2.5 rounded-xl text-sm font-bold
                  bg-surface-elevated/60 border border-surface-elevated text-slate-300
                  hover:bg-surface-elevated hover:text-slate-100
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150
                "
              >
                {pwdLoading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                {pwdLoading ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          </AccountSection>
        </div>

        <p className="text-xs text-slate-600 text-center">
          Appearance settings reset on refresh.
        </p>
      </div>
    </ModalShell>
  );
};

// ─── Disconnect Modal ─────────────────────────────────────────────────────────

const DisconnectModal: React.FC = () => {
  const { closeModal } = useUIStore();
  const { connectionError, reset } = useGameStore();
  const navigate = useNavigate();

  const handleReturnToLobby = () => {
    reset();
    closeModal();
    navigate('/lobby');
  };

  const handleDismiss = () => {
    closeModal();
  };

  return (
    <ModalShell
      title="Connection Lost"
      icon={<WifiOff size={18} className="text-red-400" />}
      persistent
    >
      <div className="flex flex-col items-center text-center gap-5">
        {/* Animated disconnect icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <WifiOff size={28} className="text-red-400" />
            </motion.div>
          </div>
          <div className="absolute inset-0 rounded-full bg-red-500/5 animate-ping" />
        </div>

        <div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {connectionError ||
              'Your connection to the table was interrupted.'}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            The server may be reconnecting automatically. If this persists,
            return to the lobby.
          </p>
        </div>

        {/* Reconnecting status */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/50 border border-surface-elevated">
          <motion.div
            className="w-2 h-2 rounded-full bg-amber-400"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="text-xs text-slate-400 font-medium">
            Attempting to reconnect…
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleDismiss}
            className="
              flex-1 py-2.5 rounded-xl text-sm font-semibold
              border border-surface-elevated text-slate-400
              hover:text-slate-200 hover:border-surface-elevated/80
              transition-colors
            "
          >
            Stay
          </button>
          <button
            onClick={handleReturnToLobby}
            className="
              flex-1 py-2.5 rounded-xl text-sm font-bold
              bg-red-500/90 hover:bg-red-500
              text-white transition-colors
            "
          >
            Leave Table
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Player Profile Modal Wrapper ────────────────────────────────────────────

/**
 * Reads selectedPlayer from uiStore and delegates to PlayerProfileCard.
 * Kept thin so PlayerProfileCard itself stays store-agnostic.
 */
const PlayerProfileModal: React.FC = () => {
  const { selectedPlayer, closeModal } = useUIStore();
  const [enrichedPlayer, setEnrichedPlayer] = useState<PlayerProfileData | null>(null);

  useEffect(() => {
    if (!selectedPlayer) {
      setEnrichedPlayer(null);
      return;
    }
    
    // Set initial data immediately
    setEnrichedPlayer(selectedPlayer);
    
    // Fetch real stats
    let isMounted = true;
    fetchLeaderboard()
      .then((entries) => {
        if (!isMounted) return;
        const entry = entries.find(e => e.username === selectedPlayer.username);
        if (entry) {
          setEnrichedPlayer({
            ...selectedPlayer,
            winRate: entry.win_rate,
            handsPlayed: entry.hands_played,
            // You can also choose to update balance to their total wealth if desired:
            // balance: entry.total_chips
          });
        }
      })
      .catch(err => {
        console.error('Failed to fetch player stats for profile card', err);
      });
      
    return () => { isMounted = false; };
  }, [selectedPlayer]);

  const handleReport = (userId: number) => {
    // TODO: hook into reporting API endpoint
    console.warn('[Report] User reported:', userId);
    closeModal();
  };

  return (
    <PlayerProfileCard
      player={enrichedPlayer}
      isVisible={!!selectedPlayer}
      onClose={closeModal}
      onReport={handleReport}
    />
  );
};

// ─── Global Modal Container ───────────────────────────────────────────────────

/**
 * GlobalModalContainer
 *
 * Listens to uiStore.activeModal and renders the appropriate modal.
 * Uses AnimatePresence so each modal gets enter/exit animations.
 * Lives inside GlobalLayout so it persists across route navigations.
 */
export const GlobalModalContainer: React.FC = () => {
  const activeModal = useUIStore((s) => s.activeModal);

  const renderModal = () => {
    switch (activeModal) {
      case 'SETTINGS':
        return <SettingsModal key="SETTINGS" />;
      case 'DISCONNECT_ALERT':
        return <DisconnectModal key="DISCONNECT_ALERT" />;
      case 'PLAYER_PROFILE':
        return <PlayerProfileModal key="PLAYER_PROFILE" />;
      case 'SESSION_SUMMARY':
        return <SessionSummaryModal key="SESSION_SUMMARY" />;
      case 'LEADERBOARD':
        return <LeaderboardModal key="LEADERBOARD" />;
      case 'TUTORIAL':
        return <TutorialModal key="TUTORIAL" />;
      case 'STOREFRONT':
        return <StorefrontModal key="STOREFRONT" />;
      case 'MY_PROFILE':
        return <MyProfileModal key="MY_PROFILE" />;
      default:
        return null;
    }
  };

  return <AnimatePresence mode="wait">{renderModal()}</AnimatePresence>;
};
