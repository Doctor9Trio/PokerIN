import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { LogOut, Plus, DoorOpen } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const LobbyPage: React.FC = () => {
  const { token, username, balance, setBalance, logout } = useAuthStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '', small_blind: '50', big_blind: '100',
    min_buy_in: '2000', max_buy_in: '20000', max_players: '6',
  });
  const [pendingTable, setPendingTable] = useState<{ invite_code: string; ws_url: string } | null>(null);
  const [error, setError] = useState('');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    // Fetch latest balance
    axios.get(`${API}/api/auth/profile/`, authHeaders)
      .then((r) => setBalance(r.data.wallet.balance))
      .catch(() => {});
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(
        `${API}/api/tables/join/`,
        { invite_code: joinCode.toUpperCase(), buy_in_amount: parseFloat(buyIn) },
        authHeaders,
      );
      setPendingTable({ invite_code: joinCode.toUpperCase(), ws_url: res.data.ws_url });
      navigate(`/table/${joinCode.toUpperCase()}?buyin=${buyIn}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join table.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API}/api/tables/create/`, createForm, authHeaders);
      const code = res.data.invite_code;
      navigate(`/table/${code}?buyin=${createForm.min_buy_in}&create=1`);
    } catch (err: any) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to create table.');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at top, #0d1f15 0%, #060f0a 50%, #030807 100%)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}
      >
        <div
          className="text-2xl font-black"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#d4af37' }}
        >
          ♠ PokerIN
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs" style={{ color: '#64748b' }}>{username}</div>
            <div className="text-sm font-bold" style={{ color: '#d4af37' }}>
              ₹{balance ? parseFloat(balance).toLocaleString('en-IN') : '—'}
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="p-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
          style={{
            background: 'rgba(15,23,42,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 20,
            padding: '28px 24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Tab switcher */}
          <div
            className="flex rounded-xl mb-6 p-1"
            style={{ background: 'rgba(30,41,59,0.6)' }}
          >
            <button
              onClick={() => setTab('join')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: tab === 'join' ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: tab === 'join' ? '#d4af37' : '#64748b',
                border: tab === 'join' ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
              }}
            >
              <DoorOpen size={15} /> Join Table
            </button>
            <button
              onClick={() => setTab('create')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: tab === 'create' ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: tab === 'create' ? '#d4af37' : '#64748b',
                border: tab === 'create' ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
              }}
            >
              <Plus size={15} /> Create Table
            </button>
          </div>

          {error && (
            <div
              className="text-xs p-3 rounded-xl mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </div>
          )}

          {tab === 'join' && (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>
                  Invite Code
                </label>
                <input
                  id="input-invite-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AX7K3P"
                  maxLength={6}
                  required
                  className="w-full rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest outline-none"
                  style={{
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(100,116,139,0.3)',
                    color: '#d4af37',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>
                  Buy-In Amount (₹)
                </label>
                <input
                  id="input-buy-in"
                  type="number"
                  value={buyIn}
                  onChange={(e) => setBuyIn(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  className="w-full rounded-xl px-4 py-3 outline-none"
                  style={{
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(100,116,139,0.3)',
                    color: '#e2e8f0',
                  }}
                />
              </div>
              <button
                id="btn-join"
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #b8962e)',
                  color: '#0f172a',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Join Table →
              </button>
            </form>
          )}

          {tab === 'create' && (
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              {[
                { key: 'name', label: 'Table Name', type: 'text', placeholder: "My Poker Night" },
                { key: 'small_blind', label: 'Small Blind (₹)', type: 'number', placeholder: '50' },
                { key: 'big_blind', label: 'Big Blind (₹)', type: 'number', placeholder: '100' },
                { key: 'min_buy_in', label: 'Min Buy-In (₹)', type: 'number', placeholder: '2000' },
                { key: 'max_buy_in', label: 'Max Buy-In (₹)', type: 'number', placeholder: '20000' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>
                    {f.label}
                  </label>
                  <input
                    id={`input-${f.key}`}
                    type={f.type}
                    value={(createForm as any)[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => setCreateForm({ ...createForm, [f.key]: e.target.value })}
                    required
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{
                      background: 'rgba(30,41,59,0.8)',
                      border: '1px solid rgba(100,116,139,0.3)',
                      color: '#e2e8f0',
                    }}
                  />
                </div>
              ))}
              <button
                id="btn-create"
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm mt-2"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Create Table →
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};
