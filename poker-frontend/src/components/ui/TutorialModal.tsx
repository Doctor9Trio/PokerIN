import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

// ─── Hand Rankings data ───────────────────────────────────────────────────────

interface HandRank {
  rank: number;
  name: string;
  shortName: string;
  example: string[];   // Card strings for visual display
  description: string;
  rarity: string;
  color: string;       // Tailwind text-color class
  bg: string;          // Tailwind bg class
}

const HAND_RANKINGS: HandRank[] = [
  {
    rank: 1, name: 'Royal Flush', shortName: 'Royal Flush',
    example: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'],
    description: 'A, K, Q, J, 10 — all the same suit. The unbeatable hand.',
    rarity: 'Extremely Rare',
    color: 'text-gold', bg: 'bg-gold/10',
  },
  {
    rank: 2, name: 'Straight Flush', shortName: 'Str. Flush',
    example: ['9♥', '8♥', '7♥', '6♥', '5♥'],
    description: 'Five consecutive cards of the same suit.',
    rarity: 'Very Rare',
    color: 'text-amber-400', bg: 'bg-amber-500/8',
  },
  {
    rank: 3, name: 'Four of a Kind', shortName: 'Four of a Kind',
    example: ['K♠', 'K♥', 'K♦', 'K♣', '7♠'],
    description: 'Four cards of the same rank.',
    rarity: 'Rare',
    color: 'text-purple-400', bg: 'bg-purple-500/8',
  },
  {
    rank: 4, name: 'Full House', shortName: 'Full House',
    example: ['J♠', 'J♥', 'J♦', '8♣', '8♠'],
    description: 'Three of a kind plus a pair.',
    rarity: 'Uncommon',
    color: 'text-blue-400', bg: 'bg-blue-500/8',
  },
  {
    rank: 5, name: 'Flush', shortName: 'Flush',
    example: ['A♦', 'J♦', '8♦', '6♦', '2♦'],
    description: 'Five cards of the same suit, not in sequence.',
    rarity: 'Uncommon',
    color: 'text-cyan-400', bg: 'bg-cyan-500/8',
  },
  {
    rank: 6, name: 'Straight', shortName: 'Straight',
    example: ['9♣', '8♦', '7♥', '6♠', '5♣'],
    description: 'Five consecutive cards of different suits.',
    rarity: 'Moderate',
    color: 'text-teal-400', bg: 'bg-teal-500/8',
  },
  {
    rank: 7, name: 'Three of a Kind', shortName: 'Three of a Kind',
    example: ['Q♠', 'Q♥', 'Q♦', '7♣', '3♠'],
    description: 'Three cards of the same rank.',
    rarity: 'Common',
    color: 'text-emerald-400', bg: 'bg-emerald-500/8',
  },
  {
    rank: 8, name: 'Two Pair', shortName: 'Two Pair',
    example: ['A♠', 'A♦', 'K♣', 'K♥', '5♠'],
    description: 'Two different pairs.',
    rarity: 'Common',
    color: 'text-green-400', bg: 'bg-green-500/8',
  },
  {
    rank: 9, name: 'Pair', shortName: 'One Pair',
    example: ['10♠', '10♦', 'A♣', '7♥', '2♠'],
    description: 'Two cards of the same rank.',
    rarity: 'Very Common',
    color: 'text-slate-300', bg: 'bg-slate-700/30',
  },
  {
    rank: 10, name: 'High Card', shortName: 'High Card',
    example: ['A♣', 'J♥', '8♦', '4♠', '2♣'],
    description: 'No combination — highest card plays.',
    rarity: 'Most Common',
    color: 'text-slate-500', bg: 'bg-slate-800/30',
  },
];

// ─── UI Guide items ───────────────────────────────────────────────────────────

const UI_GUIDE_SECTIONS = [
  {
    title: 'Action Controls',
    icon: '🎮',
    items: [
      { term: 'Fold', desc: 'Discard your hand. You lose any chips already bet.' },
      { term: 'Check', desc: 'Pass the action without betting (only available if no bet is open).' },
      { term: 'Call', desc: 'Match the current bet to stay in the hand.' },
      { term: 'Raise', desc: 'Click Raise to open the slider, set your amount, then click again to confirm.' },
      { term: 'All-In', desc: 'Push all your chips in. Even with fewer chips you can still win a side pot.' },
    ],
  },
  {
    title: 'Timer Ring',
    icon: '⏱',
    items: [
      { term: 'Green ring', desc: 'Your turn — act before the ring runs out or you\'ll auto-fold.' },
      { term: 'Ring speed', desc: 'The ring depletes over 30 seconds (configurable by the table host).' },
    ],
  },
  {
    title: 'Live Chat',
    icon: '💬',
    items: [
      { term: 'Send a message', desc: 'Type in the chat bar and press Enter or click Send.' },
      { term: 'Quick emotes', desc: 'Click the 😊 icon to open quick-reaction shortcuts (Good hand!, GG, etc.).' },
      { term: 'System messages', desc: 'Gray divider lines are auto-generated events (player joined, hand result).' },
    ],
  },
  {
    title: 'Player Avatars',
    icon: '👤',
    items: [
      { term: 'Click any avatar', desc: 'Opens that player\'s profile card with their current stack and stats.' },
      { term: 'Gold border', desc: 'Indicates your own seat.' },
      { term: 'Green glow', desc: 'Indicates whose turn it is to act.' },
      { term: 'D button', desc: 'The Dealer button — rotates every hand.' },
    ],
  },
];

// ─── Hand ranking detail card ─────────────────────────────────────────────────

const HandCard: React.FC<{ hand: HandRank; selected: boolean; onClick: () => void }> = ({
  hand,
  selected,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`
      w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150
      ${selected
        ? `${hand.bg} ${hand.color.replace('text-', 'border-')}/40`
        : 'border-transparent hover:bg-surface-elevated/30 hover:border-surface-elevated/50'
      }
    `}
  >
    <div className="flex items-center gap-2.5">
      <span className={`text-xs font-black w-5 text-center ${selected ? hand.color : 'text-slate-600'}`}>
        {hand.rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${selected ? hand.color : 'text-slate-300'}`}>
          {hand.name}
        </p>
        <p className="text-[10px] text-slate-600 truncate">{hand.rarity}</p>
      </div>
      {/* Mini card examples */}
      <div className="flex gap-0.5 flex-shrink-0">
        {hand.example.slice(0, 3).map((c, i) => {
          const isRed = c.includes('♥') || c.includes('♦');
          return (
            <span
              key={i}
              className={`text-[9px] font-black px-0.5 rounded bg-white/90 ${isRed ? 'text-red-600' : 'text-slate-900'}`}
            >
              {c}
            </span>
          );
        })}
      </div>
    </div>

    {/* Expanded detail */}
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          <div className="mt-2 pl-7">
            {/* Full example */}
            <div className="flex gap-1 mb-1.5">
              {hand.example.map((c, i) => {
                const isRed = c.includes('♥') || c.includes('♦');
                return (
                  <span
                    key={i}
                    className={`text-xs font-black px-1 py-0.5 rounded bg-white/90 ${isRed ? 'text-red-600' : 'text-slate-900'}`}
                  >
                    {c}
                  </span>
                );
              })}
            </div>
            <p className={`text-xs ${hand.color} opacity-80 leading-snug`}>{hand.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </button>
);

// ─── TutorialModal ────────────────────────────────────────────────────────────

type TutorialTab = 'hands' | 'ui';

export const TutorialModal: React.FC = () => {
  const { closeModal } = useUIStore();
  const [activeTab, setActiveTab] = useState<TutorialTab>('hands');
  const [selectedHand, setSelectedHand] = useState<number>(1);

  const toggleHand = (rank: number) =>
    setSelectedHand((prev) => (prev === rank ? -1 : rank));

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="
            pointer-events-auto w-full max-w-md
            bg-surface/96 backdrop-blur-xl
            border border-surface-elevated/60
            rounded-2xl shadow-2xl overflow-hidden
            flex flex-col max-h-[88vh]
          "
        >
          {/* Top accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-elevated/40 flex-shrink-0">
            <div className="flex items-center gap-3">
              <BookOpen size={17} className="text-gold" />
              <h2 className="font-display font-bold text-slate-100 text-base">How to Play</h2>
            </div>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-elevated/60 transition-colors"
              aria-label="Close tutorial"
            >
              <X size={15} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-2 px-4 pt-3 pb-0 flex-shrink-0">
            {([
              { key: 'hands' as TutorialTab, label: 'Hand Rankings', icon: <BookOpen size={13} /> },
              { key: 'ui' as TutorialTab, label: 'UI Guide', icon: <Monitor size={13} /> },
            ]).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold
                  border-b-2 transition-all duration-150
                  ${activeTab === key
                    ? 'text-gold border-gold bg-gold/8'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                  }
                `}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'hands' ? (
                <motion.div
                  key="hands"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 py-2 space-y-0.5"
                >
                  <p className="text-[10px] text-slate-600 px-3 pb-2 font-medium">
                    Click any hand to expand its details. Ranked strongest → weakest.
                  </p>
                  {HAND_RANKINGS.map((hand) => (
                    <HandCard
                      key={hand.rank}
                      hand={hand}
                      selected={selectedHand === hand.rank}
                      onClick={() => toggleHand(hand.rank)}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="ui"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="px-4 py-3 space-y-4"
                >
                  {UI_GUIDE_SECTIONS.map((section) => (
                    <div key={section.title}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{section.icon}</span>
                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                          {section.title}
                        </h3>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {section.items.map(({ term, desc }) => (
                          <div key={term} className="flex gap-2.5">
                            <span className="text-xs font-bold text-gold/80 flex-shrink-0 w-20 pt-0.5 truncate">
                              {term}
                            </span>
                            <span className="text-xs text-slate-500 leading-snug">{desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent flex-shrink-0" />
        </motion.div>
      </div>
    </>
  );
};
