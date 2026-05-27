import React, { useEffect, useState } from 'react';
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
  const [showBuyInModal, setShowBuyInModal] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState('1000');

  // Send buy-in on first connection
  useEffect(() => {
    if (!isConnected || hasBoughtIn.current) return;
    const buyInParam = searchParams.get('buyin');
    if (buyInParam) {
      send({ type: 'BUY_IN', amount: parseFloat(buyInParam) });
      hasBoughtIn.current = true;
    }
  }, [isConnected, searchParams, send]);

  // Show buy-in modal if stack is 0
  useEffect(() => {
    if (isConnected && tableState && !hasBoughtIn.current) {
        const myPlayer = tableState.players.find(p => p.user_id === userId);
        if (myPlayer && parseFloat(myPlayer.stack) === 0) {
            setShowBuyInModal(true);
        }
    }
  }, [isConnected, tableState, userId]);

  const handleManualBuyIn = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(buyInAmount);
    if (amount > 0) {
      send({ type: 'BUY_IN', amount });
      hasBoughtIn.current = true;
      setShowBuyInModal(false);
    }
  };

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
          onReady={() => send({ type: 'READY' })}
        />
      ) : (
        <div className="flex items-center justify-center h-full" style={{ color: '#475569' }}>
          Loading table state…
        </div>
      )}

      {/* Buy-In Modal */}
      {showBuyInModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="p-6 rounded-2xl border w-80 relative" style={{ background: '#0f172a', borderColor: '#1e293b' }}>
            <button 
              onClick={() => setShowBuyInModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#f8fafc' }}>Buy In to Play</h2>
            <form onSubmit={handleManualBuyIn} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#94a3b8' }}>Amount (₹)</label>
                <input
                  type="number"
                  value={buyInAmount}
                  onChange={(e) => setBuyInAmount(e.target.value)}
                  className="w-full bg-transparent border rounded p-2 text-white"
                  style={{ borderColor: '#334155' }}
                  min="100"
                  step="100"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded font-bold mt-2 hover:opacity-90 transition-opacity"
                style={{ background: '#d4af37', color: '#030807' }}
              >
                Join Table
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="fixed bottom-4 right-4 flex gap-2 z-[200]">
        <button
          onClick={() => setShowBuyInModal(true)}
          className="text-xs px-3 py-1.5 rounded-lg font-bold"
          style={{
            background: 'rgba(212, 175, 55, 0.15)',
            color: '#d4af37',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          Buy In
        </button>
        <button
          id="btn-leave-table"
          onClick={handleLeave}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: 'rgba(239,68,68,0.15)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          Leave Table
        </button>
      </div>
    </div>
  );
};
