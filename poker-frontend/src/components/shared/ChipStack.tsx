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
  borderColor: string;
  label: string;
}

// More premium casino colors
const DENOMINATIONS: ChipDenomination[] = [
  { value: 5000, color: '#9333ea', borderColor: '#d8b4fe', label: '5K' },
  { value: 1000, color: '#1e293b', borderColor: '#94a3b8', label: '1K' },
  { value:  500, color: '#16a34a', borderColor: '#86efac', label: '500' },
  { value:  100, color: '#dc2626', borderColor: '#fca5a5', label: '100' },
  { value:   50, color: '#2563eb', borderColor: '#93c5fd', label: '50' },
  { value:    1, color: '#f8fafc', borderColor: '#cbd5e1', label: '1'  },
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
    initial={animate ? { y: -30, opacity: 0 } : false}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
    style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${denom.borderColor} 0%, ${denom.color} 60%, #000 150%)`,
      border: `2px dashed rgba(255,255,255,0.4)`,
      boxShadow: `
        inset 0 0 0 3px ${denom.color},
        1px ${2 + index}px 4px rgba(0,0,0,0.6),
        0 0 2px rgba(0,0,0,0.8)
      `,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 9,
      fontWeight: 800,
      color: denom.value === 1 ? '#0f172a' : '#fff',
      textShadow: denom.value === 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.8)',
      flexShrink: 0,
      position: 'absolute',
      bottom: index * 5, // Stack upwards vertically
      left: 0,
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
    <div className={`flex flex-col items-center justify-center gap-1.5 ${className}`}>
      {/* Chip visuals */}
      <div className="flex items-end gap-1 drop-shadow-md">
        {chips.map(({ denom, count }) => (
          <div key={denom.value} className="relative" style={{ width: 32, height: 32 + (count - 1) * 5 }}>
            {Array.from({ length: count }, (_, i) => (
              <Chip
                key={`${denom.value}-${i}`}
                denom={denom}
                index={i}
                animate={animate}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Amount label */}
      <div
        className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
        style={{ 
          background: 'rgba(0,0,0,0.5)',
          color: '#fcd34d', 
          border: '1px solid rgba(252,211,77,0.3)',
          backdropFilter: 'blur(4px)'
        }}
      >
        ₹{Math.floor(numAmount).toLocaleString('en-IN')}
      </div>
    </div>
  );
};
