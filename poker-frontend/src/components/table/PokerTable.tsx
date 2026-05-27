import React from 'react';
import { motion } from 'framer-motion';
import { PlayerSeat } from './PlayerSeat';
import { CommunityCards } from './CommunityCards';
import { ChipStack } from '../shared/ChipStack';
import { ActionConsole } from '../controls/ActionConsole';
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
}

// Seat positions for up to 6 players around an oval table
// Expressed as percentages of the table dimensions
const SEAT_POSITIONS_6: Array<{ top: string; left: string }> = [
  { top: '85%',  left: '50%'  }, // Seat 0 — bottom center (local player)
  { top: '72%',  left: '15%'  }, // Seat 1 — bottom left
  { top: '30%',  left: '8%'   }, // Seat 2 — left
  { top: '8%',   left: '30%'  }, // Seat 3 — top left
  { top: '8%',   left: '70%'  }, // Seat 4 — top right
  { top: '30%',  left: '92%'  }, // Seat 5 — right
];

export const PokerTable: React.FC<PokerTableProps> = ({
  tableState,
  myUserId,
  myCards,
  actionRequired,
  onAction,
}) => {
  const myPlayer = tableState.players.find((p) => p.user_id === myUserId);
  const isMyTurn = tableState.current_turn === myPlayer?.seat_index;

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
          background: 'rgba(10,26,16,0.6)',
          boxShadow: '0 0 0 8px #0a1a10, 0 0 0 16px #1a3020, 0 20px 60px rgba(0,0,0,0.8)',
          padding: 12,
        }}
      >
        {/* Inner felt table */}
        <div
          className="poker-table w-full h-full rounded-full"
          style={{ borderRadius: '50%', position: 'relative' }}
        >
          {/* Center content: pot + community cards */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          >
            {/* Pot display */}
            {totalPot > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'rgba(212,175,55,0.5)' }}
                >
                  Main Pot
                </span>
                <ChipStack amount={tableState.pot} animate />
              </motion.div>
            )}

            {/* Community cards */}
            <CommunityCards
              cards={tableState.community_cards}
              gameStage={tableState.game_stage}
            />

            {/* Side pots */}
            {tableState.side_pots.length > 1 && (
              <div className="flex gap-3">
                {tableState.side_pots.map((sp, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-xs" style={{ color: '#64748b' }}>
                      Side Pot {i + 1}
                    </span>
                    <ChipStack amount={sp.amount} />
                  </div>
                ))}
              </div>
            )}

            {/* Waiting message */}
            {tableState.game_stage === 'WAITING' && (
              <div
                className="text-sm font-semibold"
                style={{ color: 'rgba(212,175,55,0.6)' }}
              >
                Waiting for players...
              </div>
            )}
          </div>

          {/* Player seats */}
          {tableState.players.map((player) => {
            const pos = SEAT_POSITIONS_6[player.seat_index] || SEAT_POSITIONS_6[0];
            return (
              <PlayerSeat
                key={player.user_id}
                player={player}
                isCurrentUser={player.user_id === myUserId}
                isActiveTurn={tableState.current_turn === player.seat_index}
                isDealer={tableState.dealer_button === player.seat_index}
                myCards={player.user_id === myUserId ? myCards : undefined}
                turnTimeoutSeconds={actionRequired?.timeout_seconds ?? 30}
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

      {/* Action console — bottom center, only when it's your turn */}
      {isMyTurn && actionRequired && myPlayer && (
        <div
          className="fixed bottom-6 left-1/2"
          style={{ transform: 'translateX(-50%)', zIndex: 100 }}
        >
          <ActionConsole
            validActions={actionRequired.valid_actions}
            callAmount={actionRequired.call_amount}
            minRaise={actionRequired.min_raise}
            pot={actionRequired.pot}
            myStack={myPlayer.stack}
            onAction={onAction}
          />
        </div>
      )}

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
