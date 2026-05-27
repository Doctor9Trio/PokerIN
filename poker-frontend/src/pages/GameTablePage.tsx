import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PokerTable } from '../components/table/PokerTable';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import type { PlayerAction } from '../types/poker';

export const GameTablePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userId, token } = useAuthStore();

  const {
    tableState,
    myCards,
    actionRequired,
    connectionError,
    isConnected,
    reset,
  } = useGameStore();

  const { send, disconnect } = useWebSocket(inviteCode || null);

  const hasBoughtIn = React.useRef(false);

  // Send buy-in on first connection
  useEffect(() => {
    if (!isConnected || hasBoughtIn.current) return;
    const buyInParam = searchParams.get('buyin');
    if (buyInParam) {
      send({ type: 'BUY_IN', amount: parseFloat(buyInParam) });
      hasBoughtIn.current = true;
    }
  }, [isConnected, searchParams, send]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      reset();
    };
  }, []);

  const handleAction = (action: PlayerAction, amount?: number) => {
    send({ type: 'PLAYER_ACTION', action, ...(amount !== undefined && { amount }) });
  };

  const handleLeave = () => {
    disconnect();
    reset();
    navigate('/lobby');
  };

  // Loading / error states
  if (!token) {
    navigate('/');
    return null;
  }

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: '#030807' }}>
      {/* Connection banner */}
      {connectionError && (
        <div
          className="fixed top-0 left-0 right-0 z-50 text-center py-2 text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
        >
          {connectionError}
        </div>
      )}

      {!isConnected && !connectionError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(3,8,7,0.9)' }}
        >
          <div className="text-center">
            <div
              className="text-3xl mb-2 animate-pulse"
              style={{ color: '#d4af37' }}
            >
              ♠
            </div>
            <div style={{ color: '#64748b' }}>Connecting to table…</div>
          </div>
        </div>
      )}

      {tableState ? (
        <PokerTable
          tableState={tableState}
          myUserId={userId!}
          myCards={myCards}
          actionRequired={actionRequired}
          onAction={handleAction}
        />
      ) : (
        <div className="flex items-center justify-center h-full" style={{ color: '#475569' }}>
          Loading table state…
        </div>
      )}

      {/* Leave button */}
      <button
        id="btn-leave-table"
        onClick={handleLeave}
        className="fixed bottom-4 right-4 text-xs px-3 py-1.5 rounded-lg"
        style={{
          background: 'rgba(239,68,68,0.15)',
          color: '#f87171',
          border: '1px solid rgba(239,68,68,0.3)',
          zIndex: 200,
        }}
      >
        Leave Table
      </button>
    </div>
  );
};
