import React, { useEffect, useRef } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import { AudioTriggers } from '../../audio/audioManager';

interface TimerRingProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
  strokeWidth?: number;
}

function getColor(ratio: number): string {
  if (ratio > 0.5) return '#22c55e';  // green
  if (ratio > 0.25) return '#f59e0b'; // amber
  return '#ef4444';                    // red
}

export const TimerRing: React.FC<TimerRingProps> = ({
  totalSeconds,
  remainingSeconds,
  size = 64,
  strokeWidth = 4,
}) => {
  const audioFired = useRef(false);
  const ratio = Math.max(0, remainingSeconds / totalSeconds);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);
  const color = getColor(ratio);

  useEffect(() => {
    if (remainingSeconds <= 5 && !audioFired.current) {
      audioFired.current = true;
      AudioTriggers.onTimerWarning();
    }
    if (remainingSeconds <= 0) {
      AudioTriggers.stopTimer();
    }
    return () => {
      if (remainingSeconds <= 0) audioFired.current = false;
    };
  }, [remainingSeconds]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset, stroke: color }}
          transition={{ duration: 0.5, ease: 'linear' }}
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      </svg>
      {/* Center countdown number */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={remainingSeconds <= 5 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        <span
          style={{
            color,
            fontSize: size * 0.28,
            fontWeight: 800,
            fontFamily: 'Outfit, sans-serif',
            textShadow: `0 0 8px ${color}`,
          }}
        >
          {Math.ceil(remainingSeconds)}
        </span>
      </motion.div>
    </div>
  );
};
