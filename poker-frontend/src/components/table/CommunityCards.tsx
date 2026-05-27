import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from '../shared/PlayingCard';
import type { CardString } from '../../types/poker';

interface CommunityCardsProps {
  cards: CardString[];
  gameStage: string;
}

const STAGE_LABELS: Record<string, string> = {
  PRE_FLOP: 'Pre-Flop',
  FLOP: 'Flop',
  TURN: 'Turn',
  RIVER: 'River',
  SHOWDOWN: 'Showdown',
  WAITING: 'Waiting',
};

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, gameStage }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Stage label */}
      <span
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: 'rgba(212,175,55,0.6)' }}
      >
        {STAGE_LABELS[gameStage] || gameStage}
      </span>

      {/* Community card row */}
      <div className="flex gap-2 items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <AnimatePresence key={i} mode="wait">
            {cards[i] ? (
              <motion.div
                key={cards[i]}
                initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
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
