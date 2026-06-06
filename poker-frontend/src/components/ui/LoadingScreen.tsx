import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';

/**
 * LoadingScreen
 *
 * A full-screen overlay that appears whenever uiStore.isLoading === true.
 * Uses framer-motion for smooth opacity fade-in/fade-out transitions.
 * Sits above all page content (z-[200]) but below dev-tools overlays.
 */
export const LoadingScreen: React.FC = () => {
  const isLoading = useUIStore((s) => s.isLoading);
  const loadingMessage = useUIStore((s) => s.loadingMessage);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-felt/95 backdrop-blur-md"
        >
          {/* ── Animated Spade Logo ── */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 20 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Outer glow ring */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-gold/20 blur-2xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Spade icon */}
              <motion.div
                className="relative text-6xl select-none"
                style={{ color: '#d4af37' }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                ♠
              </motion.div>
            </div>

            {/* Brand name */}
            <div className="flex flex-col items-center gap-2">
              <span className="font-display text-2xl font-black tracking-tight text-gold">
                PokerIN
              </span>

              {/* Loading dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gold/60"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.18,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* Loading message */}
              <motion.p
                key={loadingMessage}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-slate-500 font-medium tracking-wide"
              >
                {loadingMessage}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
