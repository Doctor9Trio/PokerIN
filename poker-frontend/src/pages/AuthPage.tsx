import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

type Mode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await axios.post(`${API}/api/auth/register/`, form);
        setMode('login');
        setForm({ ...form, password: '', password_confirm: '' });
        return;
      }

      const res = await axios.post(`${API}/api/auth/login/`, {
        username: form.username,
        password: form.password,
      });
      setAuth(res.data);
      navigate('/lobby');
    } catch (err: any) {
      const data = err.response?.data;
      setError(
        typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #0d1f15 0%, #060f0a 60%, #030807 100%)',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(212,175,55,0.05) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="text-4xl font-black mb-1"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#d4af37', letterSpacing: '-0.02em' }}
          >
            ♠ PokerIN
          </div>
          <p className="text-sm" style={{ color: '#475569' }}>Premium Texas Hold'em</p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(15,23,42,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 20,
            padding: '32px 28px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Tabs */}
          <div
            className="flex rounded-xl mb-6 p-1"
            style={{ background: 'rgba(30,41,59,0.6)' }}
          >
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={{
                  background: mode === m ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: mode === m ? '#d4af37' : '#64748b',
                  border: mode === m ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Fields */}
            {[
              { name: 'username', label: 'Username', type: 'text' },
              ...(mode === 'register' ? [{ name: 'email', label: 'Email', type: 'email' }] : []),
              { name: 'password', label: 'Password', type: 'password' },
              ...(mode === 'register' ? [{ name: 'password_confirm', label: 'Confirm Password', type: 'password' }] : []),
            ].map((f) => (
              <div key={f.name}>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: '#94a3b8' }}
                >
                  {f.label}
                </label>
                <input
                  id={`input-${f.name}`}
                  type={f.type}
                  value={(form as any)[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  required
                  autoComplete={f.type === 'password' ? 'current-password' : f.name}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(30,41,59,0.8)',
                    border: '1px solid rgba(100,116,139,0.3)',
                    color: '#e2e8f0',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(212,175,55,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(100,116,139,0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            ))}

            {error && (
              <div
                className="text-xs p-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div
                className="text-xs p-3 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.08)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)' }}
              >
                🎰 New accounts start with <strong>₹10,000</strong> in play chips
              </div>
            )}

            <button
              id="btn-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm mt-1"
              style={{
                background: loading
                  ? 'rgba(212,175,55,0.3)'
                  : 'linear-gradient(135deg, #d4af37, #b8962e)',
                color: loading ? '#94a3b8' : '#0f172a',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
