import React from 'react';
import type { CardString } from '../../types/poker';

interface PlayingCardProps {
  card: CardString;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RANK_DISPLAY: Record<string, string> = {
  T: '10', J: 'J', Q: 'Q', K: 'K', A: 'A',
};

const SUIT_SYMBOL: Record<string, string> = {
  h: '♥', d: '♦', c: '♣', s: '♠',
};

const SUIT_CLASS: Record<string, string> = {
  h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades',
};

const SIZE_MAP = {
  sm: { card: 'w-9 h-14', rank: 'text-sm', suit: 'text-lg' },
  md: { card: 'w-11 h-16', rank: 'text-base', suit: 'text-xl' },
  lg: { card: 'w-16 h-24', rank: 'text-xl', suit: 'text-3xl' },
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  className = '',
  size = 'md',
}) => {
  const sz = SIZE_MAP[size];

  // Face-down card
  if (card === 'XX' || !card) {
    return (
      <div
        className={`playing-card face-down ${sz.card} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #162e4a 50%, #1e3a5f 100%)',
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 2px,
            transparent 2px,
            transparent 8px
          )`,
        }}
      />
    );
  }

  const rank = card.slice(0, -1);
  const suit = card.slice(-1).toLowerCase();
  const displayRank = RANK_DISPLAY[rank] || rank;
  const suitSymbol = SUIT_SYMBOL[suit] || '';
  const suitClass = SUIT_CLASS[suit] || '';

  const isRed = suit === 'h' || suit === 'd';

  return (
    <div
      className={`playing-card ${suitClass} ${sz.card} ${className} relative flex flex-col justify-between p-1`}
      style={{
        background: '#fff',
        borderRadius: '6px',
        border: '1px solid rgba(0,0,0,0.1)',
        boxShadow: '2px 4px 12px rgba(0,0,0,0.5)',
        color: isRed ? '#dc2626' : '#0f172a',
      }}
    >
      {/* Top-left rank+suit */}
      <div className={`${sz.rank} font-bold leading-none flex flex-col items-start`}>
        <span>{displayRank}</span>
        <span className="text-xs leading-none">{suitSymbol}</span>
      </div>

      {/* Center suit */}
      <div className={`${sz.suit} text-center leading-none`}>{suitSymbol}</div>

      {/* Bottom-right rank+suit (rotated) */}
      <div
        className={`${sz.rank} font-bold leading-none flex flex-col items-end`}
        style={{ transform: 'rotate(180deg)' }}
      >
        <span>{displayRank}</span>
        <span className="text-xs leading-none">{suitSymbol}</span>
      </div>
    </div>
  );
};
