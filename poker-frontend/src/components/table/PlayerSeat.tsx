import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from '../shared/PlayingCard';
import { ChipStack } from '../shared/ChipStack';
import { TimerRing } from '../controls/TimerRing';
import type { PlayerState } from '../../types/poker';

interface PlayerSeatProps {
  player: PlayerState;
  isCurrentUser: boolean;
  isActiveTurn: boolean;
  isDealer: boolean;
  myCards?: string[];        // Private hole cards (only for isCurrentUser)
  turnTimeoutSeconds?: number;
  style?: React.CSSProperties;
  gameStage: string;
}

// Status badge for the player
function StatusBadge({ player, gameStage }: { player: PlayerState; gameStage: string }) {
  if (gameStage === 'WAITING' && player.is_ready) {
    return (
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(34,197,94,0.9)', color: '#fff', border: '1px solid #16a34a' }}
      >
        READY
      </div>
    );
  }

  if (player.is_folded) {
    return (
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(100,116,139,0.8)', color: '#94a3b8' }}
      >
        Folded
      </div>
    );
  }
  if (player.is_all_in) {
    return (
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}
      >
        All-In!
      </div>
    );
  }
  if (!player.is_connected) {
    return (
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(239,68,68,0.8)', color: '#fff' }}
      >
        Away
      </div>
    );
  }
  return null;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentUser,
  isActiveTurn,
  isDealer,
  myCards,
  turnTimeoutSeconds = 30,
  style,
  gameStage,
}) => {
  const [remainingTime, setRemainingTime] = useState(turnTimeoutSeconds);

  useEffect(() => {
    if (!isActiveTurn) {
      setRemainingTime(turnTimeoutSeconds);
      return;
    }
    setRemainingTime(turnTimeoutSeconds);
    const interval = setInterval(() => {
      setRemainingTime((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActiveTurn, turnTimeoutSeconds]);

  const cards = isCurrentUser && myCards ? myCards : player.hole_cards;

  return (
    <motion.div
      className="player-seat"
      style={style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Timer ring behind avatar */}
      {isActiveTurn && (
        <div className="absolute" style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }}>
          <TimerRing
            totalSeconds={turnTimeoutSeconds}
            remainingSeconds={remainingTime}
            size={72}
            strokeWidth={4}
          />
        </div>
      )}

      {/* Avatar */}
      <div className="relative">
        <StatusBadge player={player} gameStage={gameStage} />
        <div
          className={`player-avatar ${isActiveTurn ? 'active' : ''}`}
          style={{
            opacity: player.is_folded ? 0.4 : 1,
            background: isCurrentUser ? 'rgba(212,175,55,0.1)' : 'rgba(30,41,59,0.9)',
            border: isCurrentUser
              ? '2px solid rgba(212,175,55,0.6)'
              : isActiveTurn
                ? '2px solid #00ff88'
                : '2px solid rgba(212,175,55,0.2)',
          }}
        >
          {player.username.charAt(0).toUpperCase()}
        </div>

        {/* Dealer button */}
        {isDealer && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
            style={{
              background: '#d4af37',
              color: '#0f172a',
              boxShadow: '0 0 8px rgba(212,175,55,0.6)',
              fontSize: 9,
            }}
          >
            D
          </div>
        )}
      </div>

      {/* Username */}
      <span
        className="text-xs font-semibold max-w-16 truncate"
        style={{ color: isCurrentUser ? '#d4af37' : '#94a3b8' }}
      >
        {player.username}
      </span>

      {/* Hole cards */}
      <AnimatePresence>
        {cards.length > 0 && !player.is_folded && (
          <motion.div
            className="flex gap-1"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {cards.map((card, i) => (
              <PlayingCard
                key={`${card}-${i}`}
                card={card}
                size="sm"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stack and current bet */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>
          ₹{parseFloat(player.stack).toLocaleString('en-IN')}
        </span>
        {parseFloat(player.current_bet) > 0 && (
          <ChipStack amount={player.current_bet} animate />
        )}
      </div>
    </motion.div>
  );
};
