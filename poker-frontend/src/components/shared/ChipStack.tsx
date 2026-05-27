import React from 'react';
import { motion } from 'framer-motion';

interface ChipStackProps {
  amount: number | string; // INR amount
  className?: string;
  animate?: boolean;
}

interface ChipDenomination {
  value: number;
  color: string;
  border: string;
  label: string;
}

const DENOMINATIONS: ChipDenomination[] = [
  { value: 5000, color: '#a855f7', border: '#c084fc', label: '5K' },
  { value: 1000, color: '#1c1917', border: '#78716c', label: '1K' },
  { value:  500, color: '#16a34a', border: '#22c55e', label: '500' },
  { value:  100, color: '#dc2626', border: '#f87171', label: '100' },
  { value:   50, color: '#2563eb', border: '#60a5fa', label: '50' },
];

function breakdownChips(amount: number): Array<{ denom: ChipDenomination; count: number }> {
  let remaining = Math.floor(amount);
  const result: Array<{ denom: ChipDenomination; count: number }> = [];

  for (const denom of DENOMINATIONS) {
    if (remaining >= denom.value) {
      const count = Math.floor(remaining / denom.value);
      result.push({ denom, count: Math.min(count, 5) }); // Max 5 chips displayed per denom
      remaining -= count * denom.value;
    }
  }

  return result;
}

const Chip: React.FC<{ denom: ChipDenomination; index: number; animate: boolean }> = ({
  denom,
  index,
  animate,
}) => (
  <motion.div
    initial={animate ? { y: -20, opacity: 0 } : false}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
    style={{
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: denom.color,
      border: `2px dashed ${denom.border}`,
      boxShadow: `2px 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 7,
      fontWeight: 700,
      color: 'rgba(255,255,255,0.85)',
      flexShrink: 0,
      marginLeft: index > 0 ? -8 : 0, // Stack chips
      position: 'relative',
      zIndex: index,
    }}
    title={`₹${denom.value}`}
  >
    {denom.label}
  </motion.div>
);

export const ChipStack: React.FC<ChipStackProps> = ({
  amount,
  className = '',
  animate = false,
}) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (!numAmount || numAmount <= 0) return null;

  const chips = breakdownChips(numAmount);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {/* Chip visuals */}
      <div className="flex items-center">
        {chips.flatMap(({ denom, count }) =>
          Array.from({ length: count }, (_, i) => (
            <Chip
              key={`${denom.value}-${i}`}
              denom={denom}
              index={i}
              animate={animate}
            />
          ))
        )}
      </div>
      {/* Amount label */}
      <span
        className="text-xs font-bold"
        style={{ color: '#d4af37', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        ₹{numAmount.toLocaleString('en-IN')}
      </span>
    </div>
  );
};
