import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { LobbyPage } from './pages/LobbyPage';
import { GameTablePage } from './pages/GameTablePage';
import { GlobalLayout } from './components/layout/GlobalLayout';
import { useAuthStore } from './store/authStore';
import './index.css';

// ─── Route Guard ──────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public route ── */}
        <Route path="/" element={<AuthPage />} />

        {/* ── Protected routes — wrapped in GlobalLayout ── */}
        <Route
          element={
            <ProtectedRoute>
              <GlobalLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/table/:inviteCode" element={<GameTablePage />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
