import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from '../shared/PlayingCard';
import { ChipStack } from '../shared/ChipStack';
import { TimerRing } from '../controls/TimerRing';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { PlayerProfileData } from '../ui/PlayerProfileCard';
import type { PlayerState } from '../../types/poker';

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

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
  const { openPlayerProfile } = useUIStore();

  const winnerInfo = lastWinners.find(w => w.user_id === player.user_id);
  const isWinner = !!winnerInfo;

  const handleAvatarClick = () => {
    const profileData: PlayerProfileData = {
      userId: player.user_id,
      username: player.username,
      balance: player.stack,
      // winRate / handsPlayed / biggestPot populated by future stats API
    };
    openPlayerProfile(profileData);
  };

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

  const isBottomSeat = style?.top && parseFloat(style.top as string) >= 50;

  return (
    <motion.div
      className="absolute z-10 flex items-center justify-center"
      style={{ ...style, width: '64px', height: '64px', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* 1. Avatar Core Area (strictly 64x64) */}
      <div className="relative w-16 h-16 shrink-0 z-20">
        {/* Timer ring behind avatar */}
        {isActiveTurn && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            <TimerRing
              totalSeconds={turnTimeoutSeconds}
              remainingSeconds={remainingTime}
              size={80}
              strokeWidth={4}
            />
          </div>
        )}

        <StatusBadge player={player} gameStage={gameStage} />
        
        {/* Clickable avatar — opens PlayerProfileCard modal */}
        <button
          onClick={handleAvatarClick}
          title={`View ${player.username}'s profile`}
          aria-label={`Open profile for ${player.username}`}
          className="group relative focus:outline-none w-full h-full"
        >
          {/* Hover ring — appears on hover, never disrupts timer ring (z-0) */}
          <span
            className="
              absolute inset-0 rounded-full scale-110
              ring-2 ring-white/0 group-hover:ring-white/20
              transition-all duration-200 pointer-events-none
            "
          />
          <div
            className={`player-avatar w-full h-full rounded-full ${isActiveTurn ? 'active animate-pulse' : ''}`}
            style={{
              opacity: player.is_folded ? 0.5 : 1,
              background: isCurrentUser ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #334155, #1e293b)',
              border: isCurrentUser
                ? '3px solid rgba(212,175,55,0.8)'
                : '3px solid rgba(255,255,255,0.1)',
              boxShadow: isActiveTurn ? '0 0 25px rgba(0, 255, 136, 0.4), inset 0 0 10px rgba(0, 255, 136, 0.2)' : 'none',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            {player.avatar_url ? (
              <img
                src={player.avatar_url.startsWith('http') ? player.avatar_url : `${API_BASE}${player.avatar_url}`}
                alt={player.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-xl font-bold">
                {player.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </button>

        {/* Winner Crown */}
        {isWinner && (
          <motion.div 
            initial={{ scale: 0, y: -20, opacity: 0 }}
            animate={{ scale: 1.2, y: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.6, delay: 0.8 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl drop-shadow-2xl z-40"
            style={{ filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 1))' }}
          >
            👑
          </motion.div>
        )}

        {/* Winning Amount Popup */}
        <AnimatePresence>
          {isWinner && gameStage === 'SHOWDOWN' && (
            <motion.div 
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: [0, 1, 1, 0], y: -90, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, ease: "easeOut", delay: 1.2, times: [0, 0.15, 0.85, 1] }}
              className="absolute top-0 left-1/2 -translate-x-1/2 font-bold text-yellow-400 whitespace-nowrap z-50 text-2xl tracking-wide"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,1)' }}
            >
              + ₹{winnerInfo.amount_won}
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

        {/* Username */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-30">
          <span
            className="text-[10px] font-bold max-w-[80px] truncate px-2 py-0.5 rounded-full inline-block"
            style={{ 
              color: isCurrentUser ? '#fde047' : '#e2e8f0',
              background: 'rgba(15,23,42,0.85)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {player.username}
          </span>
        </div>
      </div>

      {/* 2. Cards & Stack Flow (Absolutely positioned outside the 64x64 core) */}
      <div 
        className={`absolute flex flex-col items-center gap-1.5 w-[140px] pointer-events-none ${
          isBottomSeat ? 'bottom-full mb-4 flex-col-reverse' : 'top-full mt-4'
        }`}
      >
        {/* Hole cards (Nicely fanned out) */}
        <AnimatePresence>
          {cards.length > 0 && !player.is_folded && (
            <motion.div
              className="flex z-20 relative pointer-events-auto"
              initial={{ y: isBottomSeat ? 20 : -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {cards.map((card, i) => {
                const isWinningCard = gameStage === 'SHOWDOWN' && winnerInfo?.winning_cards?.includes(card);
                return (
                  <motion.div 
                    key={`${card}-${i}`} 
                    className={`transition-transform hover:${isBottomSeat ? 'translate-y-2' : '-translate-y-2'}`}
                    animate={{
                      scale: isWinningCard ? 1.05 : 1,
                      y: isWinningCard ? (isBottomSeat ? 5 : -5) : 0
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    style={{ 
                      marginLeft: i > 0 ? -16 : 0, 
                      transform: `rotate(${i === 0 ? -6 : 6}deg) translateY(${i === 0 ? 2 : 0}px)`,
                      zIndex: isWinningCard ? 30 : i,
                      opacity: gameStage === 'SHOWDOWN' ? (isWinningCard ? 1 : 0.4) : 1,
                      boxShadow: isWinningCard ? '0 0 15px rgba(212,175,55,0.4), 0 0 0 2px rgba(212,175,55,0.8)' : 'none',
                      borderRadius: '4px' // Ensure shadow follows the card shape
                    }}
                  >
                    <PlayingCard card={card} size="sm" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stack and current bet */}
        <div className={`flex flex-col items-center gap-1.5 z-10 pointer-events-auto ${isBottomSeat ? 'flex-col-reverse' : ''}`}>
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
