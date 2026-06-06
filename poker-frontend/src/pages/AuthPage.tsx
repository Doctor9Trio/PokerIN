import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

type Mode = 'login' | 'register';

// ─── Floating card suit decoration ───────────────────────────────────────────

interface FloatingSuitProps {
  suit: string;
  className: string;
  delay?: number;
  size?: string;
}

const FloatingSuit: React.FC<FloatingSuitProps> = ({
  suit,
  className,
  delay = 0,
  size = 'text-5xl',
}) => (
  <motion.span
    className={`absolute select-none pointer-events-none ${size} ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: [0, -14, 0] }}
    transition={{
      opacity: { duration: 1.2, delay },
      y: { duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay },
    }}
  >
    {suit}
  </motion.span>
);

// ─── Reusable input field ─────────────────────────────────────────────────────

interface AuthInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  autoComplete?: string;
  onChange: (v: string) => void;
}

const AuthInput: React.FC<AuthInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  autoComplete,
  onChange,
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-slate-400 tracking-wide">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      required
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full rounded-xl px-4 py-3 text-sm outline-none
        bg-black/30 border border-white/10
        text-slate-100 placeholder-slate-600
        transition-all duration-200
        focus:border-gold/60 focus:ring-2 focus:ring-gold/15 focus:bg-black/50
      "
    />
  </div>
);

// ─── Main AuthPage ────────────────────────────────────────────────────────────

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const setField = (key: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await axios.post(`${API}/api/auth/register/`, form);
        setSuccessMsg('Account created! Please sign in.');
        setMode('login');
        setForm({ username: form.username, email: '', password: '', password_confirm: '' });
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
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-felt">

      {/* ── Rich layered background ─────────────────────────────────────── */}
      {/* Base radial felt */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,#0d2b1a_0%,#060f0a_55%,#030605_100%)]" />
      {/* Gold horizon glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_100%,rgba(212,175,55,0.07)_0%,transparent_70%)]" />
      {/* Top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

      {/* ── Floating suit decorations ────────────────────────────────────── */}
      <FloatingSuit suit="♠" className="text-white/5 top-[12%] left-[8%]"  size="text-[9rem]" delay={0} />
      <FloatingSuit suit="♥" className="text-red-900/20 top-[8%]  right-[10%]" size="text-[7rem]" delay={1.2} />
      <FloatingSuit suit="♦" className="text-red-900/15 bottom-[18%] left-[6%]"  size="text-[6rem]" delay={0.6} />
      <FloatingSuit suit="♣" className="text-white/5 bottom-[15%] right-[8%]" size="text-[8rem]" delay={1.8} />

      {/* ── Main card ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.1 }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        {/* ── Logo / Hero section ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          {/* Animated spade badge */}
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
              bg-gold/10 border border-gold/25 shadow-gold-glow"
            animate={{ boxShadow: [
              '0 0 20px rgba(212,175,55,0.25)',
              '0 0 40px rgba(212,175,55,0.45)',
              '0 0 20px rgba(212,175,55,0.25)',
            ]}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-4xl text-gold select-none">♠</span>
          </motion.div>

          <h1 className="font-display text-4xl font-black tracking-tight text-gold leading-none mb-1.5">
            PokerIN
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-widest uppercase">
            Premium Texas Hold'em
          </p>
        </div>

        {/* ── Glassmorphic form card ──────────────────────────────────── */}
        <div className="
          bg-black/40 backdrop-blur-xl
          border border-white/10
          rounded-2xl shadow-2xl
          overflow-hidden
        ">
          {/* Top gold accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          <div className="p-7">
            {/* ── Tab switcher ─────────────────────────────────────────── */}
            <div className="flex gap-1.5 p-1 mb-6 rounded-xl bg-white/5 border border-white/8">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`
                    flex-1 py-2 rounded-lg text-sm font-bold capitalize
                    transition-all duration-200
                    ${mode === m
                      ? 'bg-gold/20 text-gold border border-gold/35 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                    }
                  `}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {/* ── Form ─────────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 16 : -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-3.5"
              >
                <AuthInput
                  id="input-username"
                  label="Username"
                  value={form.username}
                  autoComplete="username"
                  onChange={setField('username')}
                />

                {mode === 'register' && (
                  <AuthInput
                    id="input-email"
                    label="Email Address"
                    type="email"
                    value={form.email}
                    autoComplete="email"
                    onChange={setField('email')}
                  />
                )}

                <AuthInput
                  id="input-password"
                  label="Password"
                  type="password"
                  value={form.password}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  onChange={setField('password')}
                />

                {mode === 'register' && (
                  <AuthInput
                    id="input-password-confirm"
                    label="Confirm Password"
                    type="password"
                    value={form.password_confirm}
                    autoComplete="new-password"
                    onChange={setField('password_confirm')}
                  />
                )}

                {/* ── Status messages ─────────────────────────────────── */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-medium
                        bg-red-500/12 border border-red-500/25 text-red-400"
                    >
                      {error}
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-medium
                        bg-emerald-500/12 border border-emerald-500/25 text-emerald-400"
                    >
                      {successMsg}
                    </motion.div>
                  )}
                  {mode === 'register' && !error && !successMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-medium
                        bg-gold/8 border border-gold/20 text-gold/80"
                    >
                      🎰 New accounts start with <strong>₹10,000</strong> in play chips
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Primary CTA Button ──────────────────────────────── */}
                <motion.button
                  id="btn-submit"
                  type="submit"
                  disabled={loading}
                  whileHover={loading ? {} : { scale: 1.015 }}
                  whileTap={loading ? {} : { scale: 0.985 }}
                  className={`
                    relative w-full py-3.5 mt-1 rounded-xl
                    font-display font-bold text-base tracking-wide
                    overflow-hidden transition-all duration-200
                    ${loading
                      ? 'bg-gold/25 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gold to-gold-light text-surface cursor-pointer shadow-gold-glow'
                    }
                  `}
                >
                  {/* Animated shimmer on idle */}
                  {!loading && (
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                    />
                  )}
                  <span className="relative">
                    {loading
                      ? 'Please wait…'
                      : mode === 'login'
                      ? '♠ Play Now'
                      : 'Create Account'}
                  </span>
                </motion.button>
              </motion.form>
            </AnimatePresence>
          </div>

          {/* Bottom gold accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-700 mt-5">
          By playing, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
};
