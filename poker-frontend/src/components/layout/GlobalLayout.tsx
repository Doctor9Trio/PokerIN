import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { GlobalModalContainer } from '../ui/GlobalModalContainer';
import { LoadingScreen } from '../ui/LoadingScreen';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';

/**
 * GlobalLayout
 *
 * The single root wrapper for all protected routes (/lobby, /table/:id).
 * Responsibilities:
 *   1. Render the page content via <Outlet />.
 *   2. Mount the GlobalModalContainer so modals survive route transitions.
 *   3. Mount the LoadingScreen overlay.
 *   4. Watch isConnected from gameStore — if the socket drops while on a
 *      table route, automatically surface the DISCONNECT_ALERT modal.
 */
export const GlobalLayout: React.FC = () => {
  const location = useLocation();
  const isConnected = useGameStore((s) => s.isConnected);
  const connectionError = useGameStore((s) => s.connectionError);
  const { openModal, activeModal } = useUIStore();

  // Track whether we are currently on a /table/* route
  const isOnTableRoute = location.pathname.startsWith('/table/');

  // Ref to know if the socket was previously connected (prevents false trigger
  // on initial mount when isConnected is still false before first open).
  const wasConnected = useRef(false);

  useEffect(() => {
    if (isConnected) {
      wasConnected.current = true;
    }

    // Only surface the disconnect modal on a table route, after we were
    // previously connected, and only if no other modal is already open.
    if (
      isOnTableRoute &&
      wasConnected.current &&
      !isConnected &&
      connectionError &&
      activeModal !== 'DISCONNECT_ALERT'
    ) {
      openModal('DISCONNECT_ALERT');
    }
  }, [isConnected, connectionError, isOnTableRoute, activeModal, openModal]);

  // Reset the wasConnected tracker when leaving the table
  useEffect(() => {
    if (!isOnTableRoute) {
      wasConnected.current = false;
    }
  }, [isOnTableRoute]);

  return (
    <>
      {/* Page content */}
      <Outlet />

      {/* Global overlays — rendered above all page content */}
      <GlobalModalContainer />
      <LoadingScreen />
    </>
  );
};
