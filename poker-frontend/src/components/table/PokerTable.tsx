import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerSeat } from './PlayerSeat';
import { CommunityCards } from './CommunityCards';
import { ChipStack } from '../shared/ChipStack';
import { ActionConsole } from '../controls/ActionConsole';
import { useGameStore } from '../../store/gameStore';
import { useEconomyStore, COSMETIC_CATALOGUE } from '../../store/economyStore';
import type { TableState, PlayerAction } from '../../types/poker';

interface PokerTableProps {
  tableState: TableState;
  myUserId: number;
  myCards: string[];
  actionRequired: {
    valid_actions: PlayerAction[];
    call_amount: string;
    min_raise: string;
    pot: string;
    timeout_seconds: number;
  } | null;
  onAction: (action: PlayerAction, amount?: number) => void;
  onReady: () => void;
}

// Seat positions for up to 6 players around an oval table
// Expressed as percentages of the table dimensions
const SEAT_POSITIONS_6: Array<{ top: string; left: string }> = [
  { top: '85%',  left: '50%'  }, // Seat 0 — bottom center (local player)
  { top: '70%',  left: '15%'  }, // Seat 1 — bottom left
  { top: '25%',  left: '15%'  }, // Seat 2 — top left
  { top: '10%',  left: '50%'  }, // Seat 3 — top center
  { top: '25%',  left: '85%'  }, // Seat 4 — top right
  { top: '70%',  left: '85%'  }, // Seat 5 — bottom right
];

export const PokerTable: React.FC<PokerTableProps> = ({
  tableState,
  myUserId,
  myCards,
  actionRequired,
  onAction,
  onReady,
}) => {
  const myPlayer = tableState.players.find((p) => Number(p.user_id) === Number(myUserId));
  const { lastWinners } = useGameStore();
  // Precise selector: only re-render when equipped cosmetics change.
  // Without a selector, Zustand would re-render on ANY store mutation
  // (e.g. premiumCurrency updates during chip pack purchases), causing
  // a visual delay as the table remounts unnecessarily.
  const equipped = useEconomyStore((state) => state.equipped);
  
  const isMyTurn = tableState.current_turn === myPlayer?.seat_index;
  const mySeatIndex = myPlayer ? myPlayer.seat_index : 0;

  const feltItem = COSMETIC_CATALOGUE.find((c) => c.id === equipped.felt);

  const getFeltRingStyle = (feltId: string) => {
    switch (feltId) {
      case 'felt_midnight': return { bg: 'rgba(10,15,30,0.6)', ring1: '#0a0f1e', ring2: '#0f172a' };
      case 'felt_ruby':     return { bg: 'rgba(30,10,10,0.6)', ring1: '#1e0a0a', ring2: '#2a0f0f' };
      case 'felt_obsidian': return { bg: 'rgba(15,10,25,0.6)', ring1: '#0f0a19', ring2: '#1a0f2e' };
      case 'felt_emerald':  return { bg: 'rgba(5,25,15,0.6)',  ring1: '#05190f', ring2: '#0f2a1e' };
      case 'felt_gold':     return { bg: 'rgba(30,20,5,0.6)',  ring1: '#1e1405', ring2: '#2a1a05' };
      case 'felt_classic':
      default:              return { bg: 'rgba(10,26,16,0.6)', ring1: '#0a1a10', ring2: '#1a3020' };
    }
  };
  const ringStyle = getFeltRingStyle(equipped.felt);

  // Helper to get normalized position so the local player is always at the bottom center (index 0)
  const getNormalizedSeatPosition = (actualSeatIndex: number) => {
    const visualIndex = (actualSeatIndex - mySeatIndex + 6) % 6;
    return SEAT_POSITIONS_6[visualIndex] || SEAT_POSITIONS_6[0];
  };

  const totalPot = parseFloat(tableState.pot) +
    tableState.players.reduce((s, p) => s + parseFloat(p.current_bet || '0'), 0);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={{ background: '#060f0a', minHeight: '100vh' }}
    >
      {/* Outer table ring */}
      <div
        className="relative"
        style={{
          width: 'min(90vw, 900px)',
          height: 'min(80vh, 520px)',
          borderRadius: '50%',
          background: ringStyle.bg,
          boxShadow: `0 0 0 8px ${ringStyle.ring1}, 0 0 0 16px ${ringStyle.ring2}, 0 20px 60px rgba(0,0,0,0.8)`,
          padding: 12,
        }}
      >
        {/* Inner felt table */}
        <div
          className={`poker-table w-full h-full rounded-full ${feltItem?.previewClass || ''}`}
          style={{ borderRadius: '50%', position: 'relative' }}
        >
          {/* Center content: pot + community cards */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none"
          >
            {/* Main pot */}
            {parseFloat(tableState.pot) > 0 && (
              <motion.div
                key={`main-pot-${tableState.hand_number}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: tableState.game_stage === 'SHOWDOWN' ? 0 : 1 
                }}
                transition={{ 
                  delay: tableState.game_stage === 'SHOWDOWN' ? 1.5 : 0, 
                  duration: 0.1 
                }}
                className="flex flex-col items-center gap-1 z-10"
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700 backdrop-blur-md shadow-lg"
                  style={{ color: '#d4af37' }}
                >
                  Main Pot
                </span>
                <ChipStack amount={tableState.pot} animate />
              </motion.div>
            )}

            {/* Winning Pot Animation (Slides to Winner) */}
            <AnimatePresence>
              {tableState.game_stage === 'SHOWDOWN' && lastWinners.length > 0 && (
                <>
                  {lastWinners.map((winner) => {
                    const pos = getNormalizedSeatPosition(winner.seat_index);
                    return (
                      <motion.div
                        key={`pot-anim-${tableState.hand_number}-${winner.user_id}`}
                        initial={{ top: '38%', left: '50%', scale: 1, opacity: 0, x: '-50%', y: '-50%' }}
                        animate={{ 
                          top: pos.top, 
                          left: pos.left, 
                          scale: 0.5, 
                          opacity: [0, 1, 1, 0],
                          x: '-50%', y: '-50%'
                        }}
                        transition={{ 
                          top: { duration: 0.8, delay: 1.5, ease: [0.25, 1, 0.5, 1] },
                          left: { duration: 0.8, delay: 1.5, ease: [0.25, 1, 0.5, 1] },
                          scale: { duration: 0.8, delay: 1.5, ease: "easeIn" },
                          opacity: { duration: 0.8, delay: 1.5, times: [0, 0.01, 0.8, 1] }
                        }}
                        className="absolute pointer-events-none z-50 flex flex-col items-center drop-shadow-2xl"
                      >
                        <ChipStack amount={winner.amount_won} />
                      </motion.div>
                    );
                  })}
                </>
              )}
            </AnimatePresence>

            {/* Community cards */}
            <CommunityCards
              cards={tableState.community_cards}
              gameStage={tableState.game_stage}
              winningCards={lastWinners.length > 0 ? lastWinners[0].winning_cards : undefined}
              handRank={lastWinners.length > 0 ? lastWinners[0].hand_rank : undefined}
            />

            {/* Side pots */}
            {tableState.side_pots.length > 1 && tableState.game_stage !== 'SHOWDOWN' && (
              <div className="flex gap-3 z-10">
                {tableState.side_pots.map((sp, i) => (
                  <div key={i} className="flex flex-col items-center px-2 py-1 bg-slate-900/60 rounded-lg">
                    <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>
                      SIDE POT {i + 1}
                    </span>
                    <ChipStack amount={sp.amount} />
                  </div>
                ))}
              </div>
            )}

            {/* Waiting message */}
            {tableState.game_stage === 'WAITING' && (
              <div
                className="text-sm font-semibold px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700 shadow-lg"
                style={{ color: '#d4af37' }}
              >
                Waiting for players...
              </div>
            )}
          </div>

          {/* Player seats */}
          {tableState.players.map((player) => {
            const pos = getNormalizedSeatPosition(player.seat_index);
            return (
              <PlayerSeat
                key={player.user_id}
                player={player}
                isCurrentUser={Number(player.user_id) === Number(myUserId)}
                isActiveTurn={tableState.current_turn === player.seat_index}
                isDealer={tableState.dealer_button === player.seat_index}
                myCards={Number(player.user_id) === Number(myUserId) ? myCards : undefined}
                turnTimeoutSeconds={actionRequired?.timeout_seconds ?? 30}
                gameStage={tableState.game_stage}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Action Console / Bottom Bar */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto">
          {tableState.game_stage === 'WAITING' && myPlayer && parseFloat(myPlayer.stack) > 0 ? (
            !myPlayer.is_ready ? (
              <button
                onClick={onReady}
                className="px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #aa8022)',
                  color: '#1e293b',
                  boxShadow: '0 0 20px rgba(212,175,55,0.4)',
                }}
              >
                Ready to Play
              </button>
            ) : (
              <div
                className="px-6 py-2 rounded-xl font-semibold text-sm"
                style={{
                  background: 'rgba(30,41,59,0.8)',
                  color: '#d4af37',
                  border: '1px solid rgba(212,175,55,0.3)',
                }}
              >
                Waiting for others to be ready...
              </div>
            )
          ) : isMyTurn && actionRequired ? (
            <ActionConsole
              validActions={actionRequired.valid_actions}
              callAmount={actionRequired.call_amount}
              minRaise={actionRequired.min_raise}
              pot={actionRequired.pot}
              myStack={myPlayer.stack}
              onAction={onAction}
            />
          ) : null}
        </div>
      </div>

      {/* Table info — top bar */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full text-xs"
        style={{
          background: 'rgba(15,23,42,0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(212,175,55,0.15)',
          color: '#64748b',
          zIndex: 50,
        }}
      >
        <span style={{ color: '#d4af37' }}>#{tableState.table_id}</span>
        <span>Hand #{tableState.hand_number}</span>
        <span>BB: ₹{tableState.big_blind}</span>
        <span
          style={{
            color: ['WAITING'].includes(tableState.game_stage) ? '#64748b' : '#00ff88',
          }}
        >
          {tableState.game_stage.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};
