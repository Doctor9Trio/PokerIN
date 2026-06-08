import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  LogOut,
  Plus,
  DoorOpen,
  Settings,
  Wallet,
  Trophy,
  User,
  ChevronRight,
  Hash,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

const API =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

// ─── Reusable form field ──────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  maxLength?: number;
  min?: string;
  required?: boolean;
  uppercase?: boolean;
  className?: string;
}

const Field: React.FC<FieldProps> = ({
  id, label, type = 'text', value, placeholder, onChange,
  maxLength, min, required = true, uppercase = false, className = '',
}) => (
  <div className={className}>
    <label htmlFor={id} className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      min={min}
      required={required}
      onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
      className="
        w-full rounded-xl px-4 py-2.5 text-sm outline-none
        bg-white/4 border border-white/8
        text-slate-200 placeholder-slate-700
        focus:border-gold/50 focus:ring-2 focus:ring-gold/10 focus:bg-white/6
        transition-all duration-200
      "
    />
  </div>
);

// ─── Create Table Form ────────────────────────────────────────────────────────

interface CreateFormState {
  name: string;
  small_blind: string;
  big_blind: string;
  min_buy_in: string;
  max_buy_in: string;
  max_players: string;
}

interface CreateFormProps {
  onSuccess: (code: string, minBuyIn: string) => void;
  onError: (msg: string) => void;
  token: string;
}

const CreateTableForm: React.FC<CreateFormProps> = ({ onSuccess, onError, token }) => {
  const [form, setForm] = useState<CreateFormState>({
    name: '',
    small_blind: '50',
    // big_blind = 2 × small_blind = 100
    big_blind: '100',
    // min_buy_in must be ≥ 20 × big_blind = 2000
    min_buy_in: '2000',
    max_buy_in: '10000',
    max_players: '6',
  });
  const [submitting, setSubmitting] = useState(false);

  // When small blind changes → auto-set big blind and re-derive min buy-in
  const handleSmallBlind = (v: string) => {
    const sb = parseFloat(v) || 0;
    const bb = sb * 2;
    const minBuyin = bb * 20;
    setForm((p) => ({
      ...p,
      small_blind: v,
      big_blind: String(bb || ''),
      min_buy_in: String(minBuyin || ''),
      max_buy_in: String(Math.max(parseFloat(p.max_buy_in) || 0, minBuyin)),
    }));
  };

  // When big blind changes directly → re-derive min buy-in (must be ≥ 20×BB)
  const handleBigBlind = (v: string) => {
    const bb = parseFloat(v) || 0;
    const minBuyin = bb * 20;
    setForm((p) => ({
      ...p,
      big_blind: v,
      min_buy_in: String(minBuyin || ''),
      max_buy_in: String(Math.max(parseFloat(p.max_buy_in) || 0, minBuyin)),
    }));
  };

  // When min buy-in changes → ensure max ≥ min
  const handleMinBuyIn = (v: string) => {
    const min = parseFloat(v) || 0;
    setForm((p) => ({
      ...p,
      min_buy_in: v,
      max_buy_in: String(Math.max(parseFloat(p.max_buy_in) || 0, min)),
    }));
  };

  const set = (k: keyof CreateFormState) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API}/api/tables/create/`,
        {
          name: form.name,
          small_blind: parseFloat(form.small_blind),
          big_blind: parseFloat(form.big_blind),
          min_buy_in: parseFloat(form.min_buy_in),
          max_buy_in: parseFloat(form.max_buy_in),
          max_players: parseInt(form.max_players, 10),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onSuccess(res.data.invite_code, form.min_buy_in);
    } catch (err: any) {
      onError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Failed to create table.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <Field
        id="create-name"
        label="Table Name"
        value={form.name}
        placeholder="e.g. High Stakes VIP"
        onChange={set('name')}
        maxLength={40}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Field id="create-sb" label="Small Blind (₹)" type="number" value={form.small_blind} min="1" onChange={handleSmallBlind} />
        <Field id="create-bb" label="Big Blind (₹)"   type="number" value={form.big_blind}   min="1" onChange={handleBigBlind} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field id="create-min" label="Min Buy-in (₹)" type="number" value={form.min_buy_in} min="1" onChange={handleMinBuyIn} />
        <Field id="create-max" label="Max Buy-in (₹)" type="number" value={form.max_buy_in} min="1" onChange={set('max_buy_in')} />
      </div>
      <Field id="create-seats" label="Max Players" type="number" value={form.max_players} min="2" onChange={set('max_players')} />

      <button
        type="submit"
        disabled={submitting}
        className="
          relative mt-1 w-full py-3 rounded-xl
          font-display font-bold text-sm tracking-wide overflow-hidden
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150
          flex items-center justify-center gap-2
          text-surface
        "
        style={{
          background: 'linear-gradient(135deg, #d4af37, #f0cc5a)',
          boxShadow: '0 0 20px rgba(212,175,55,0.25)',
        }}
      >
        {!submitting && (
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2 }}
          />
        )}
        <Plus size={15} className="relative" />
        <span className="relative">{submitting ? 'Creating…' : 'Create Table'}</span>
      </button>
    </form>
  );
};

// ─── Join Table Form ──────────────────────────────────────────────────────────

interface JoinFormProps {
  token: string;
  onSuccess: (code: string, buyIn: string) => void;
  onError: (msg: string) => void;
}

const JoinTableForm: React.FC<JoinFormProps> = ({ token, onSuccess, onError }) => {
  const [code, setCode] = useState('');
  const [buyIn, setBuyIn] = useState('1000');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { onError('Enter a table code first.'); return; }
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/tables/join/`,
        { invite_code: code.toUpperCase(), buy_in_amount: parseFloat(buyIn) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onSuccess(code.toUpperCase(), buyIn);
    } catch (err: any) {
      onError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Could not join table.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <Field
        id="join-code"
        label="Table Code"
        value={code}
        placeholder="e.g. XKQJ7"
        onChange={setCode}
        uppercase
        maxLength={8}
      />
      <Field
        id="join-buyin"
        label="Buy-in Amount (₹)"
        type="number"
        value={buyIn}
        min="1"
        onChange={setBuyIn}
      />
      <button
        type="submit"
        disabled={submitting}
        className="
          mt-1 w-full py-3 rounded-xl
          font-display font-bold text-sm tracking-wide
          border border-white/10 bg-white/5
          text-slate-200 hover:bg-white/8 hover:border-white/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150
          flex items-center justify-center gap-2
        "
      >
        <DoorOpen size={15} />
        {submitting ? 'Joining…' : 'Join Table'}
        <ChevronRight size={13} className="opacity-50" />
      </button>
    </form>
  );
};

// ─── Quick Stat Card ──────────────────────────────────────────────────────────

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  delay: number;
}

const QuickStat: React.FC<QuickStatProps> = ({ icon, label, value, accent, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="flex flex-col gap-1 px-4 py-3.5 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-sm"
  >
    <span className={`${accent} opacity-70`}>{icon}</span>
    <span className={`font-display font-black text-lg leading-tight ${accent}`}>{value}</span>
    <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">{label}</span>
  </motion.div>
);

// ─── Decorative floating suit ─────────────────────────────────────────────────

const FloatSuit: React.FC<{ suit: string; style: React.CSSProperties; duration?: number; delay?: number }> = ({
  suit, style, duration = 8, delay = 0,
}) => (
  <motion.span
    className="absolute select-none pointer-events-none font-black"
    style={{ fontSize: '6rem', opacity: 0.025, ...style }}
    animate={{ y: [-8, 8, -8], rotate: [-3, 3, -3] }}
    transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
  >
    {suit}
  </motion.span>
);

// ─── Main Lobby ───────────────────────────────────────────────────────────────

type Tab = 'join' | 'create';

export const LobbyPage: React.FC = () => {
  const { token, username, balance, avatarUrl, setBalance, logout } = useAuthStore();
  const { openModal, setLoading } = useUIStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('join');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/auth/profile/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setBalance(r.data.wallet.balance))
      .catch(() => {});
  }, [token, setBalance]);

  const handleCreateSuccess = (code: string, minBuyIn: string) => {
    setLoading(true, 'Setting up your table…');
    setTimeout(() => { setLoading(false); navigate(`/table/${code}?buyin=${minBuyIn}&create=1`); }, 800);
  };

  const handleJoinSuccess = (code: string, buyIn: string) => {
    setLoading(true, 'Joining table…');
    setTimeout(() => { setLoading(false); navigate(`/table/${code}?buyin=${buyIn}`); }, 600);
  };

  const balanceFmt = balance
    ? `₹${parseFloat(balance).toLocaleString('en-IN')}`
    : '—';

  return (
    <div
      className="min-h-screen flex flex-col overflow-y-auto"
      style={{ background: '#060e18' }}
    >
      {/* ── Rich ambient background ────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,#0b1f12_0%,#060e18_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_5%_50%,rgba(212,175,55,0.04)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_95%_20%,rgba(56,189,248,0.03)_0%,transparent_70%)]" />
        <FloatSuit suit="♠" style={{ bottom: '10%', left: '5%' }} duration={9} />
        <FloatSuit suit="♥" style={{ top: '15%', right: '8%', color: '#ef4444' }} duration={11} delay={2} />
        <FloatSuit suit="♦" style={{ bottom: '25%', right: '4%', color: '#ef4444' }} duration={8} delay={4} />
        <FloatSuit suit="♣" style={{ top: '30%', left: '3%' }} duration={12} delay={1} />
      </div>

      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3"
        style={{
          background: 'rgba(6,14,24,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="text-gold text-xl select-none"
          >♠</motion.span>
          <span className="font-display text-xl font-black tracking-tight text-gold">PokerIN</span>
        </div>

        {/* Nav actions */}
        <div className="flex items-center gap-2">
          {/* User pill */}
          <button
            id="btn-my-profile"
            onClick={() => openModal('MY_PROFILE')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 group"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.3)' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-[10px] font-black text-gold">{username?.charAt(0).toUpperCase()}</span>
              }
            </div>
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{username}</span>
          </button>

          {/* Profile icon (mobile) */}
          <button
            id="btn-profile-icon"
            onClick={() => openModal('MY_PROFILE')}
            className="p-2 rounded-xl sm:hidden text-slate-500 hover:text-gold transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <User size={16} />
          </button>

          {/* Leaderboard */}
          <button
            id="btn-leaderboard"
            onClick={() => openModal('LEADERBOARD')}
            title="Leaderboard"
            className="p-2 rounded-xl text-slate-500 hover:text-gold transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Trophy size={16} />
          </button>

          {/* Settings */}
          <button
            id="btn-settings"
            onClick={() => openModal('SETTINGS')}
            title="Settings"
            className="p-2 rounded-xl text-slate-500 hover:text-gold transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Settings size={16} />
          </button>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={() => { logout(); navigate('/'); }}
            title="Log out"
            className="p-2 rounded-xl text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            style={{ border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="relative flex-1 flex flex-col items-center justify-center py-10 px-4">

        {/* ── Hero section ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Welcome chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span className="text-xs font-semibold text-gold/80">Live Tables Running</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Welcome back,{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #d4af37, #f0cc5a)' }}
            >
              {username}
            </span>
          </h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Ready to play? Join a table or create your own private game.
          </p>
        </motion.div>

        {/* ── Quick stats row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
          <QuickStat
            icon={<Wallet size={16} />}
            label="Balance"
            value={balanceFmt}
            accent="text-gold"
            delay={0.1}
          />
          <QuickStat
            icon={<Zap size={16} />}
            label="Status"
            value="Online"
            accent="text-neon-green"
            delay={0.18}
          />
          <QuickStat
            icon={<TrendingUp size={16} />}
            label="Season"
            value="Active"
            accent="text-neon-blue"
            delay={0.26}
          />
        </div>

        {/* ── Action card ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.15 }}
          className="w-full max-w-md"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 24px 48px rgba(0,0,0,0.5)',
            }}
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

            {/* Tab switcher */}
            <div className="flex p-2.5 gap-2 border-b"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {([
                { key: 'join'   as Tab, label: 'Join Table',   icon: <DoorOpen size={14} /> },
                { key: 'create' as Tab, label: 'Create Table', icon: <Plus    size={14} /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  id={`tab-${key}`}
                  onClick={() => { setTab(key); setError(''); }}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5
                    py-2.5 rounded-xl text-sm font-bold
                    border transition-all duration-200
                    ${tab === key
                      ? 'bg-gold/12 border-gold/30 text-gold'
                      : 'bg-transparent border-transparent text-slate-600 hover:text-slate-300 hover:bg-white/5'
                    }
                  `}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Form area */}
            <div className="p-5">
              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mb-4 px-4 py-2.5 rounded-xl text-xs font-medium
                      bg-red-500/10 border border-red-500/20 text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {tab === 'join' ? (
                  <motion.div
                    key="join"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18 }}
                  >
                    <JoinTableForm
                      token={token!}
                      onSuccess={handleJoinSuccess}
                      onError={setError}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                  >
                    <CreateTableForm
                      token={token!}
                      onSuccess={handleCreateSuccess}
                      onError={setError}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
          </div>
        </motion.div>

        {/* ── Bottom CTAs ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
        >
          <button
            onClick={() => openModal('LEADERBOARD')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-gold transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Trophy size={13} />
            View Leaderboard
          </button>
          <button
            onClick={() => openModal('MY_PROFILE')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-gold transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <User size={13} />
            My Profile
          </button>
          <button
            onClick={() => openModal('TUTORIAL')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-gold transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Hash size={13} />
            How to Play
          </button>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-700 mt-6">
          🎰 New accounts start with{' '}
          <span className="text-gold font-semibold">₹10,000</span> in play chips
        </p>
      </main>
    </div>
  );
};
