import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from '../shared/PlayingCard';
import { ChipStack } from '../shared/ChipStack';
import { TimerRing } from '../controls/TimerRing';
import { useGameStore } from '../../store/gameStore';
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
        className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full z-20"
        style={{ background: 'rgba(34,197,94,0.9)', color: '#fff', border: '1px solid #16a34a' }}
      >
        READY
      </div>
    );
  }

  if (player.is_folded) {
    return (
      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-md"
        style={{ background: 'rgba(15,23,42,0.9)', color: '#94a3b8', border: '1px solid #334155' }}
      >
        FOLDED
      </div>
    );
  }
  if (player.is_all_in) {
    return (
      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-md"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', color: '#fff' }}
      >
        ALL-IN!
      </div>
    );
  }
  if (!player.is_connected) {
    return (
      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-md"
        style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
      >
        AWAY
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
  const { lastWinners } = useGameStore();

  const winnerInfo = lastWinners.find(w => w.user_id === player.user_id);
  const isWinner = !!winnerInfo;

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
      className="player-seat absolute z-10"
      style={style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="relative flex flex-col items-center">
        {/* Timer ring behind avatar */}
        {isActiveTurn && (
          <div className="absolute top-7 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            <TimerRing
              totalSeconds={turnTimeoutSeconds}
              remainingSeconds={remainingTime}
              size={80}
              strokeWidth={4}
            />
          </div>
        )}

        {/* Avatar Area */}
        <div className="relative z-10">
          <StatusBadge player={player} gameStage={gameStage} />
          
          <div
            className={`player-avatar ${isActiveTurn ? 'active' : ''}`}
            style={{
              opacity: player.is_folded ? 0.5 : 1,
              background: isCurrentUser ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #334155, #1e293b)',
              border: isCurrentUser
                ? '3px solid rgba(212,175,55,0.8)'
                : isActiveTurn
                  ? '3px solid #00ff88'
                  : '3px solid rgba(255,255,255,0.1)',
            }}
          >
            {player.username.charAt(0).toUpperCase()}
          </div>

          {/* Winner Crown */}
          {isWinner && (
            <motion.div 
              initial={{ scale: 0, y: 10, rotate: -20 }}
              animate={{ scale: 1, y: 0, rotate: 15 }}
              transition={{ type: 'spring', bounce: 0.6 }}
              className="absolute -top-3 -right-3 text-3xl drop-shadow-xl z-30"
              style={{ filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.8))' }}
            >
              👑
            </motion.div>
          )}

          {/* Winning Amount Popup */}
          <AnimatePresence>
            {isWinner && gameStage === 'SHOWDOWN' && (
              <motion.div 
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -45, scale: 1.1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute top-0 left-1/2 -translate-x-1/2 font-black text-green-400 drop-shadow-lg whitespace-nowrap z-50 text-lg flex flex-col items-center"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                <span>+ ₹{winnerInfo.amount_won}</span>
                {winnerInfo.hand_rank && (
                  <span className="text-[10px] text-yellow-300 mt-0.5">{winnerInfo.hand_rank.toUpperCase()}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dealer button */}
          {isDealer && (
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black z-20"
              style={{
                background: 'linear-gradient(135deg, #fde047, #d4af37)',
                color: '#0f172a',
                boxShadow: '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.6)',
                border: '1px solid #713f12',
              }}
            >
              D
            </div>
          )}
        </div>

        {/* Username */}
        <span
          className="text-xs font-bold max-w-[80px] truncate mt-1.5 z-10 px-2 py-0.5 rounded-full"
          style={{ 
            color: isCurrentUser ? '#fde047' : '#e2e8f0',
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {player.username}
        </span>

        {/* Hole cards (Nicely fanned out, placed below username) */}
        <AnimatePresence>
          {cards.length > 0 && !player.is_folded && (
            <motion.div
              className="flex mt-1 z-20 relative"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {cards.map((card, i) => (
                <div 
                  key={`${card}-${i}`} 
                  className="transition-transform hover:-translate-y-2"
                  style={{ 
                    marginLeft: i > 0 ? -16 : 0, 
                    transform: `rotate(${i === 0 ? -6 : 6}deg) translateY(${i === 0 ? 2 : 0}px)`,
                    zIndex: i
                  }}
                >
                  <PlayingCard card={card} size="sm" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stack and current bet */}
        <div className="flex flex-col items-center gap-1.5 mt-2 z-10">
          <span 
            className="text-[11px] font-black px-2.5 py-0.5 rounded-full" 
            style={{ 
              color: '#fff', 
              background: '#0f172a',
              border: '1px solid #334155',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            ₹{parseFloat(player.stack).toLocaleString('en-IN')}
          </span>
          
          <div className="h-8 flex items-center justify-center">
            {parseFloat(player.current_bet) > 0 && (
              <ChipStack amount={player.current_bet} animate />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
