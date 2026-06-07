import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, WifiOff, Settings, Volume2, VolumeX, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { PlayerProfileCard } from './PlayerProfileCard';
import { SessionSummaryModal } from './SessionSummaryModal';
import { LeaderboardModal } from './LeaderboardModal';
import { TutorialModal } from './TutorialModal';

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

// ─── Settings Modal ───────────────────────────────────────────────────────────

const SettingsModal: React.FC = () => {
  const { closeModal, settings, updateSetting } = useUIStore();

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

  return (
    <ModalShell
      title="Settings"
      icon={<Settings size={18} />}
      onClose={closeModal}
    >
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

      <p className="text-xs text-slate-600 mt-4 text-center">
        Settings are applied immediately and reset on refresh.
      </p>
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

  const handleReport = (userId: number) => {
    // TODO: hook into reporting API endpoint
    console.warn('[Report] User reported:', userId);
    closeModal();
  };

  return (
    <PlayerProfileCard
      player={selectedPlayer}
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
      default:
        return null;
    }
  };

  return <AnimatePresence mode="wait">{renderModal()}</AnimatePresence>;
};
