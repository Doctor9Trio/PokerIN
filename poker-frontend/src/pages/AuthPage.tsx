import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

type Mode = 'login' | 'register';

// ─── Animated playing card ────────────────────────────────────────────────────

interface FloatCardProps {
  suit: string;
  rank: string;
  x: string;
  y: string;
  rotate: number;
  delay: number;
  color?: string;
}

const FloatCard: React.FC<FloatCardProps> = ({ suit, rank, x, y, rotate, delay, color = '#fff' }) => (
  <motion.div
    className="absolute rounded-xl border flex flex-col text-sm font-black select-none pointer-events-none"
    style={{
      left: x,
      top: y,
      width: 52,
      height: 72,
      background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      color,
      padding: '6px 8px',
    }}
    initial={{ opacity: 0, y: 40, rotate: rotate - 10 }}
    animate={{
      opacity: [0, 0.8, 0.8, 0],
      y: [40, 0, -20, -60],
      rotate: [rotate - 10, rotate, rotate + 5],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      repeatDelay: 2,
      ease: 'easeInOut',
    }}
  >
    <span className="text-xs leading-none">{rank}</span>
    <span className="text-lg leading-none text-center mt-auto mb-auto">{suit}</span>
    <span className="text-xs leading-none self-end rotate-180">{rank}</span>
  </motion.div>
);

// ─── Input field ──────────────────────────────────────────────────────────────

interface AuthInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  autoComplete?: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}

const AuthInput: React.FC<AuthInputProps> = ({
  id, label, type = 'text', value, autoComplete, onChange, icon,
}) => {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-400 tracking-wide">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={inputType}
          value={value}
          required
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full rounded-xl py-3 text-sm outline-none
            bg-white/5 border border-white/10
            text-slate-100 placeholder-slate-600
            transition-all duration-200
            focus:border-gold/60 focus:ring-2 focus:ring-gold/15 focus:bg-white/8
            ${icon ? 'pl-10 pr-4' : 'px-4'}
            ${isPassword ? 'pr-10' : ''}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            tabIndex={-1}
          >
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Feature pill ──────────────────────────────────────────────────────────────

const FeaturePill: React.FC<{ icon: string; text: string; delay: number }> = ({ icon, text, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/8 text-sm text-slate-300"
  >
    <span className="text-base">{icon}</span>
    <span className="text-xs font-medium">{text}</span>
  </motion.div>
);

// ─── AuthPage ─────────────────────────────────────────────────────────────────

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirm: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const setField = (key: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [key]: v }));

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
    <div className="relative min-h-screen flex overflow-hidden" style={{ background: '#060e18' }}>

      {/* ── Rich ambient background ──────────────────────────────────────── */}
      <div className="absolute inset-0">
        {/* Deep felt radial */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_30%_50%,#0b1f12_0%,#060e18_60%)]" />
        {/* Gold horizon */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_80%,rgba(212,175,55,0.06)_0%,transparent_70%)]" />
        {/* Right accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_80%_20%,rgba(56,189,248,0.04)_0%,transparent_70%)]" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/50" />
      </div>

      {/* ── Left Hero Panel ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex relative flex-col justify-between w-1/2 px-16 py-14"
      >
        {/* Floating cards backdrop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatCard suit="♠" rank="A" x="8%" y="15%" rotate={-12} delay={0} />
          <FloatCard suit="♥" rank="K" x="20%" y="55%" rotate={8} delay={1.2} color="#ef4444" />
          <FloatCard suit="♦" rank="Q" x="55%" y="20%" rotate={15} delay={0.7} color="#ef4444" />
          <FloatCard suit="♣" rank="J" x="65%" y="60%" rotate={-8} delay={1.8} />
          <FloatCard suit="♠" rank="10" x="38%" y="70%" rotate={5} delay={2.4} />
          <FloatCard suit="♥" rank="A" x="75%" y="35%" rotate={-18} delay={0.4} color="#ef4444" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(212,175,55,0.25)', '0 0 50px rgba(212,175,55,0.5)', '0 0 20px rgba(212,175,55,0.25)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/10 border border-gold/25 mb-6"
          >
            <span className="text-3xl text-gold select-none">♠</span>
          </motion.div>
          <h1 className="font-display text-5xl font-black tracking-tight text-white leading-none mb-2">
            PokerIN
          </h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase font-medium">
            Premium Texas Hold'em
          </p>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8 py-12">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl font-black text-white leading-tight mb-4"
            >
              Play like a{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #d4af37, #f0cc5a)' }}
              >
                Pro.
              </span>
              <br />
              Win like a{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #00ff88, #38bdf8)' }}
              >
                King.
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-slate-500 text-sm leading-relaxed max-w-sm"
            >
              Join thousands of players in real-time Texas Hold'em.
              Build your bankroll, climb the leaderboard, and prove
              you have what it takes.
            </motion.p>
          </div>

          <div className="flex flex-col gap-2.5">
            <FeaturePill icon="💰" text="Start with ₹10,000 in play chips" delay={0.5} />
            <FeaturePill icon="🏆" text="Compete on the global leaderboard" delay={0.62} />
            <FeaturePill icon="⚡" text="Real-time multiplayer with live tables" delay={0.74} />
            <FeaturePill icon="🃏" text="Custom avatars and player profiles" delay={0.86} />
          </div>
        </div>

        {/* Decorative bottom suits */}
        <div className="relative z-10 flex items-center gap-4">
          {['♠', '♥', '♦', '♣'].map((s, i) => (
            <span
              key={s}
              className="text-2xl select-none"
              style={{ color: i % 2 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }}
            >
              {s}
            </span>
          ))}
          <span className="text-xs text-slate-700 ml-2">PokerIN © 2024</span>
        </div>

        {/* Vertical divider */}
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
      </motion.div>

      {/* ── Right Form Panel ─────────────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center px-6 py-10">

        {/* Mobile logo (hidden on lg) */}
        <div className="absolute top-8 left-0 right-0 flex justify-center lg:hidden">
          <div className="flex items-center gap-2">
            <span className="text-gold text-xl">♠</span>
            <span className="font-display text-xl font-black text-gold">PokerIN</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(15,23,42,0.85)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(212,175,55,0.1), 0 32px 64px rgba(0,0,0,0.7)',
            }}
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

            <div className="p-8">
              {/* Heading */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-gold" />
                  <span className="text-xs font-semibold text-gold/70 uppercase tracking-wider">
                    {mode === 'login' ? 'Welcome back' : 'Join the table'}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-black text-white">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1.5 p-1 mb-6 rounded-xl bg-white/4 border border-white/6">
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

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'login' ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'login' ? 12 : -12 }}
                  transition={{ duration: 0.18 }}
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

                  {/* Feedback */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-medium
                          bg-red-500/10 border border-red-500/20 text-red-400"
                      >
                        {error}
                      </motion.div>
                    )}
                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-medium
                          bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
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
                          bg-gold/6 border border-gold/18 text-gold/80"
                      >
                        🎰 New accounts start with <strong>₹10,000</strong> in play chips
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CTA */}
                  <motion.button
                    id="btn-submit"
                    type="submit"
                    disabled={loading}
                    whileHover={loading ? {} : { scale: 1.012 }}
                    whileTap={loading ? {} : { scale: 0.988 }}
                    className={`
                      relative w-full py-3.5 mt-1 rounded-xl
                      font-display font-bold text-base tracking-wide
                      overflow-hidden transition-all duration-200
                      flex items-center justify-center gap-2
                      ${loading
                        ? 'bg-gold/20 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gold to-gold-light text-surface cursor-pointer'
                      }
                    `}
                    style={!loading ? { boxShadow: '0 0 20px rgba(212,175,55,0.3)' } : {}}
                  >
                    {!loading && (
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }}
                      />
                    )}
                    <span className="relative">
                      {loading
                        ? 'Please wait…'
                        : mode === 'login'
                        ? 'Sign In'
                        : 'Create Account'}
                    </span>
                    {!loading && <ArrowRight size={16} className="relative" />}
                  </motion.button>
                </motion.form>
              </AnimatePresence>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          </div>

          <p className="text-center text-xs text-slate-700 mt-5">
            By playing, you agree to our Terms of Service
          </p>
        </motion.div>
      </div>
    </div>
  );
};
