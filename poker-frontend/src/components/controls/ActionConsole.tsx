import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../audio/audioManager';
import type { PlayerAction } from '../../types/poker';

interface ActionConsoleProps {
  validActions: PlayerAction[];
  callAmount: string;
  minRaise: string;
  pot: string;
  myStack: string;
  onAction: (action: PlayerAction, amount?: number) => void;
  disabled?: boolean;
}

const formatINR = (val: string | number) => {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

export const ActionConsole: React.FC<ActionConsoleProps> = ({
  validActions,
  callAmount,
  minRaise,
  pot,
  myStack,
  onAction,
  disabled = false,
}) => {
  const maxRaise = parseFloat(myStack);
  const minRaiseNum = parseFloat(minRaise);
  const potNum = parseFloat(pot);
  const callNum = parseFloat(callAmount);

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaiseNum);
  const [showSlider, setShowSlider] = useState(false);

  const canCheck  = validActions.includes('CHECK');
  const canCall   = validActions.includes('CALL');
  const canRaise  = validActions.includes('RAISE');
  const canFold   = validActions.includes('FOLD');
  const canAllIn  = validActions.includes('ALL_IN');

  const quickBets = [
    { label: 'Min', value: minRaiseNum },
    { label: '½ Pot', value: Math.floor(potNum / 2) },
    { label: 'Pot', value: potNum },
    { label: 'Max', value: maxRaise },
  ];

  const handleFold = useCallback(() => {
    playSound('fold');
    onAction('FOLD');
  }, [onAction]);

  const handleCheck = useCallback(() => {
    playSound('check');
    onAction('CHECK');
  }, [onAction]);

  const handleCall = useCallback(() => {
    playSound('chip_place');
    onAction('CALL');
  }, [onAction]);

  const handleRaise = useCallback(() => {
    playSound('chip_riffle');
    onAction('RAISE', raiseAmount);
    setShowSlider(false);
  }, [onAction, raiseAmount]);

  const handleAllIn = useCallback(() => {
    playSound('chip_riffle');
    onAction('ALL_IN');
  }, [onAction]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col gap-3"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 16,
          padding: '16px 20px',
          minWidth: 360,
        }}
      >
        {/* Raise slider */}
        <AnimatePresence>
          {showSlider && (canRaise || canAllIn) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-2"
            >
              {/* Quick bet presets */}
              <div className="flex gap-2">
                {quickBets.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setRaiseAmount(Math.min(Math.max(q.value, minRaiseNum), maxRaise))}
                    className="flex-1 text-xs font-bold py-1.5 rounded-lg border transition-all"
                    style={{
                      background: 'rgba(30,41,59,0.8)',
                      borderColor: raiseAmount === q.value ? '#d4af37' : 'rgba(100,116,139,0.4)',
                      color: raiseAmount === q.value ? '#d4af37' : '#94a3b8',
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={minRaiseNum}
                  max={maxRaise}
                  step={parseFloat(minRaise.includes('.') ? '0.01' : '50')}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(parseFloat(e.target.value))}
                  className="flex-1"
                  style={{
                    '--val': `${((raiseAmount - minRaiseNum) / (maxRaise - minRaiseNum)) * 100}%`,
                  } as React.CSSProperties}
                />
                <span
                  className="text-sm font-bold w-20 text-right"
                  style={{ color: '#d4af37' }}
                >
                  {formatINR(raiseAmount)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-2">
          {canFold && (
            <button
              id="btn-fold"
              onClick={handleFold}
              disabled={disabled}
              className="btn-action btn-fold flex-1"
            >
              Fold
            </button>
          )}

          {canCheck && (
            <button
              id="btn-check"
              onClick={handleCheck}
              disabled={disabled}
              className="btn-action btn-check flex-1"
            >
              Check
            </button>
          )}

          {canCall && !canCheck && (
            <button
              id="btn-call"
              onClick={handleCall}
              disabled={disabled}
              className="btn-action btn-call flex-1"
            >
              Call {callNum > 0 ? formatINR(callNum) : ''}
            </button>
          )}

          {canRaise && (
            <button
              id="btn-raise"
              onClick={showSlider ? handleRaise : () => setShowSlider(true)}
              disabled={disabled}
              className="btn-action btn-raise flex-1"
            >
              {showSlider ? `Raise to ${formatINR(raiseAmount)}` : 'Raise'}
            </button>
          )}

          {canAllIn && (
            <button
              id="btn-allin"
              onClick={handleAllIn}
              disabled={disabled}
              className="btn-action btn-allin"
            >
              All-In
            </button>
          )}
        </div>

        {/* Pot info */}
        <div className="flex justify-between text-xs" style={{ color: '#64748b' }}>
          <span>Pot: <span style={{ color: '#d4af37' }}>{formatINR(pot)}</span></span>
          {callNum > 0 && (
            <span>To call: <span style={{ color: '#38bdf8' }}>{formatINR(callNum)}</span></span>
          )}
          <span>Stack: <span style={{ color: '#94a3b8' }}>{formatINR(myStack)}</span></span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
