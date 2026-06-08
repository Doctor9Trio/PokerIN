import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from '../shared/PlayingCard';
import type { CardString } from '../../types/poker';

interface CommunityCardsProps {
  cards: CardString[];
  gameStage: string;
  winningCards?: CardString[];
  handRank?: string;
}

const STAGE_LABELS: Record<string, string> = {
  PRE_FLOP: 'Pre-Flop',
  FLOP: 'Flop',
  TURN: 'Turn',
  RIVER: 'River',
  SHOWDOWN: 'Showdown',
  WAITING: 'Waiting',
};

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, gameStage, winningCards, handRank }) => {
  return (
    <div className="flex flex-col items-center gap-2 relative">
      {/* Stage label or Winning Hand Rank */}
      <AnimatePresence mode="wait">
        {gameStage === 'SHOWDOWN' && handRank ? (
            <motion.div
              key="showdown-banner"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="absolute z-50 px-5 py-1.5 rounded-full flex items-center justify-center gap-2 backdrop-blur-md"
              style={{ 
                bottom: 'calc(100% + 12px)',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                borderTop: '1px solid rgba(212, 175, 55, 0.5)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.8)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-sm drop-shadow-md" style={{ filter: 'brightness(1.2)' }}>🏆</span>
              <span 
                className="text-xs font-black uppercase tracking-[0.2em] text-transparent bg-clip-text"
                style={{ 
                  backgroundImage: 'linear-gradient(to bottom, #fef08a, #d4af37)',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))'
                }}
              >
                {handRank}
              </span>
            </motion.div>
        ) : (
          <motion.span
            key="stage-label"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'rgba(212,175,55,0.6)' }}
          >
            {STAGE_LABELS[gameStage] || gameStage}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Community card row */}
      <div className="flex gap-2 items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <AnimatePresence key={i} mode="wait">
            {cards[i] ? (
              <motion.div
                key={cards[i]}
                initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                animate={{ 
                  rotateY: 0, 
                  opacity: gameStage === 'SHOWDOWN' && winningCards && winningCards.length > 0 
                    ? (winningCards.includes(cards[i]) ? 1 : 0.4) 
                    : 1, 
                  scale: gameStage === 'SHOWDOWN' && winningCards?.includes(cards[i]) ? 1.05 : 1,
                  boxShadow: gameStage === 'SHOWDOWN' && winningCards?.includes(cards[i]) 
                    ? '0 0 10px rgba(212,175,55,0.2), 0 0 0 1px rgba(212,175,55,0.6)' 
                    : 'none',
                  zIndex: gameStage === 'SHOWDOWN' && winningCards?.includes(cards[i]) ? 10 : 1
                }}
                transition={{
                  delay: i < 3 ? i * 0.12 : 0,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                style={{ perspective: 600 }}
              >
                <PlayingCard card={cards[i]} size="lg" />
              </motion.div>
            ) : (
              <motion.div
                key={`empty-${i}`}
                style={{
                  width: 64,
                  height: 96,
                  borderRadius: 8,
                  border: '2px dashed rgba(212,175,55,0.15)',
                  background: 'rgba(13,31,21,0.5)',
                }}
              />
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  );
};
