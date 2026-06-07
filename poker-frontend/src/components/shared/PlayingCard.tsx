import React from 'react';
import type { CardString } from '../../types/poker';
import { useEconomyStore, COSMETIC_CATALOGUE } from '../../store/economyStore';

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

const SIZE_MAP = {
  sm: { card: 'w-10 h-14', rank: 'text-base', suit: 'text-xl' },
  md: { card: 'w-14 h-20', rank: 'text-lg', suit: 'text-2xl' },
  lg: { card: 'w-20 h-28', rank: 'text-2xl', suit: 'text-4xl' },
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  className = '',
  size = 'md',
}) => {
  const sz = SIZE_MAP[size];
  const { equipped } = useEconomyStore();

  // Face-down card
  if (card === 'XX' || !card) {
    const cardBackItem = COSMETIC_CATALOGUE.find((c) => c.id === equipped.cardBack);
    const bgClass = cardBackItem?.previewClass || 'bg-gradient-to-br from-slate-700 to-slate-900';

    return (
      <div
        className={`relative flex-shrink-0 rounded-lg shadow-lg overflow-hidden ${sz.card} ${bgClass} ${className}`}
        style={{
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.05) 0px,
              rgba(255,255,255,0.05) 2px,
              transparent 2px,
              transparent 6px
            )`,
          }}
        />
      </div>
    );
  }

  const rank = card.slice(0, -1);
  const suit = card.slice(-1).toLowerCase();
  const displayRank = RANK_DISPLAY[rank] || rank;
  const suitSymbol = SUIT_SYMBOL[suit] || '';

  const isRed = suit === 'h' || suit === 'd';
  const color = isRed ? '#f87171' : '#f1f5f9'; // Soft red or off-white for black suits

  return (
    <div
      className={`relative flex-shrink-0 rounded-lg ${sz.card} ${className}`}
      style={{
        background: 'linear-gradient(145deg, #334155, #1e293b)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        color: color,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Top-left */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none opacity-90">
        <span className={`${sz.rank} font-bold tracking-tighter`}>{displayRank}</span>
        <span className={`${sz.suit}`}>{suitSymbol}</span>
      </div>

      {/* Bottom-right */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none opacity-90 rotate-180">
        <span className={`${sz.rank} font-bold tracking-tighter`}>{displayRank}</span>
        <span className={`${sz.suit}`}>{suitSymbol}</span>
      </div>
    </div>
  );
};
