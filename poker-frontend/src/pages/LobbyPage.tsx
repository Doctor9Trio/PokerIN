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
  Users,
  Zap,
  ChevronRight,
  Hash,
  Trophy,
  BookOpen,
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
  id,
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  maxLength,
  min,
  required = true,
  uppercase = false,
  className = '',
}) => (
  <div className={className}>
    <label htmlFor={id} className="block text-xs font-semibold text-slate-400 mb-1.5">
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
      onChange={(e) =>
        onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)
      }
      className="
        w-full rounded-xl px-4 py-2.5 text-sm outline-none
        bg-surface-card border border-surface-elevated
        text-slate-200 placeholder-slate-600
        focus:border-gold/50 focus:ring-2 focus:ring-gold/10
        transition-all duration-150
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
    big_blind: '100',
    min_buy_in: '2000',
    max_buy_in: '20000',
    max_players: '6',
  });
  const [submitting, setSubmitting] = useState(false);

  const f = (key: keyof CreateFormState) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/api/tables/create/`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess(res.data.invite_code, form.min_buy_in);
    } catch (err: any) {
      const data = err.response?.data;
      onError(
        typeof data === 'object'
          ? Object.values(data).flat().join(' ')
          : 'Failed to create table.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field
        id="input-name"
        label="Table Name"
        value={form.name}
        placeholder="My Poker Night"
        onChange={f('name')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          id="input-small-blind"
          label="Small Blind (₹)"
          type="number"
          value={form.small_blind}
          placeholder="50"
          onChange={f('small_blind')}
        />
        <Field
          id="input-big-blind"
          label="Big Blind (₹)"
          type="number"
          value={form.big_blind}
          placeholder="100"
          onChange={f('big_blind')}
        />
        <Field
          id="input-min-buy-in"
          label="Min Buy-In (₹)"
          type="number"
          value={form.min_buy_in}
          placeholder="2000"
          onChange={f('min_buy_in')}
        />
        <Field
          id="input-max-buy-in"
          label="Max Buy-In (₹)"
          type="number"
          value={form.max_buy_in}
          placeholder="20000"
          onChange={f('max_buy_in')}
        />
      </div>

      {/* Max players selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Max Players
        </label>
        <div className="flex gap-2">
          {['2', '4', '6'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm((p) => ({ ...p, max_players: n }))}
              className={`
                flex-1 py-2 rounded-xl text-sm font-bold border transition-all duration-150
                ${
                  form.max_players === n
                    ? 'bg-gold/15 border-gold/40 text-gold'
                    : 'bg-surface-card border-surface-elevated text-slate-500 hover:border-surface-elevated/80 hover:text-slate-300'
                }
              `}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        id="btn-create"
        type="submit"
        disabled={submitting}
        className="
          w-full py-3 mt-1 rounded-xl font-bold text-sm
          bg-emerald-600 hover:bg-emerald-500
          disabled:opacity-50 disabled:cursor-not-allowed
          text-white transition-colors duration-150
          flex items-center justify-center gap-2
        "
      >
        <Plus size={16} />
        {submitting ? 'Creating…' : 'Create Table'}
      </button>
    </form>
  );
};

// ─── Join Table Form ──────────────────────────────────────────────────────────

interface JoinFormProps {
  onSuccess: (code: string, buyIn: string) => void;
  onError: (msg: string) => void;
  token: string;
}

const JoinTableForm: React.FC<JoinFormProps> = ({ onSuccess, onError, token }) => {
  const [joinCode, setJoinCode] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/api/tables/join/`,
        { invite_code: joinCode.toUpperCase(), buy_in_amount: parseFloat(buyIn) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess(joinCode.toUpperCase(), buyIn);
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to join table.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Code input */}
      <div>
        <label htmlFor="input-invite-code" className="block text-xs font-semibold text-slate-400 mb-1.5">
          Invite Code
        </label>
        <div className="relative">
          <Hash
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            id="input-invite-code"
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="AX7K3P"
            maxLength={6}
            required
            className="
              w-full rounded-xl pl-9 pr-4 py-3
              text-center text-2xl font-black tracking-[0.3em]
              bg-surface-card border border-surface-elevated
              text-gold placeholder-slate-700
              focus:border-gold/50 focus:ring-2 focus:ring-gold/10
              outline-none transition-all duration-150
            "
          />
        </div>
      </div>

      <Field
        id="input-buy-in"
        label="Buy-In Amount (₹)"
        type="number"
        value={buyIn}
        placeholder="e.g. 5000"
        min="100"
        onChange={setBuyIn}
      />

      <button
        id="btn-join"
        type="submit"
        disabled={submitting || joinCode.length < 4}
        className="
          w-full py-3 rounded-xl font-bold text-sm
          bg-gold hover:bg-gold-light
          disabled:opacity-50 disabled:cursor-not-allowed
          text-surface transition-colors duration-150
          flex items-center justify-center gap-2
        "
      >
        <DoorOpen size={16} />
        {submitting ? 'Joining…' : 'Join Table'}
        <ChevronRight size={14} className="opacity-60" />
      </button>
    </form>
  );
};

// ─── Main Lobby Dashboard ─────────────────────────────────────────────────────

type Tab = 'join' | 'create';

export const LobbyPage: React.FC = () => {
  const { token, username, balance, setBalance, logout } = useAuthStore();
  const { openModal, setLoading } = useUIStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('join');
  const [error, setError] = useState('');

  // ── Fetch balance on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setBalance(r.data.wallet.balance))
      .catch(() => {});
  }, [token, setBalance]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateSuccess = (code: string, minBuyIn: string) => {
    setLoading(true, 'Setting up your table…');
    setTimeout(() => {
      setLoading(false);
      navigate(`/table/${code}?buyin=${minBuyIn}&create=1`);
    }, 800);
  };

  const handleJoinSuccess = (code: string, buyIn: string) => {
    setLoading(true, 'Joining table…');
    setTimeout(() => {
      setLoading(false);
      navigate(`/table/${code}?buyin=${buyIn}`);
    }, 600);
  };

  const handleError = (msg: string) => setError(msg);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ── Stats bar items ────────────────────────────────────────────────────────
  const stats = [
    {
      icon: <Wallet size={15} />,
      label: 'Balance',
      value: balance
        ? `₹${parseFloat(balance).toLocaleString('en-IN')}`
        : '—',
      accent: 'text-gold',
    },
    {
      icon: <Users size={15} />,
      label: 'Tables Active',
      value: '–',
      accent: 'text-neon-blue',
    },
    {
      icon: <Zap size={15} />,
      label: 'Status',
      value: 'Online',
      accent: 'text-neon-green',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-felt">
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-gold/10 bg-felt/80 backdrop-blur-sm sticky top-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="text-gold text-xl">♠</span>
          <span className="font-display text-xl font-black tracking-tight text-gold">
            PokerIN
          </span>
        </div>

        {/* User summary + actions */}
        <div className="flex items-center gap-3">
          {/* User pill */}
          <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-card border border-surface-elevated">
            <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
              <span className="text-xs font-black text-gold">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-300">{username}</span>
          </div>

          {/* Leaderboard */}
          <button
            id="btn-leaderboard"
            onClick={() => openModal('LEADERBOARD')}
            title="Global Leaderboard"
            className="
              p-2 rounded-xl
              bg-surface-card border border-surface-elevated
              text-slate-400 hover:text-gold hover:border-gold/30
              transition-colors
            "
          >
            <Trophy size={16} />
          </button>

          {/* Tutorial */}
          <button
            id="btn-tutorial"
            onClick={() => openModal('TUTORIAL')}
            title="How to Play"
            className="
              p-2 rounded-xl
              bg-surface-card border border-surface-elevated
              text-slate-400 hover:text-slate-200 hover:border-surface-elevated/80
              transition-colors
            "
          >
            <BookOpen size={16} />
          </button>

          {/* Settings */}
          <button
            id="btn-settings"
            onClick={() => openModal('SETTINGS')}
            title="Settings"
            className="
              p-2 rounded-xl
              bg-surface-card border border-surface-elevated
              text-slate-400 hover:text-slate-200 hover:border-surface-elevated/80
              transition-colors
            "
          >
            <Settings size={16} />
          </button>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            title="Log out"
            className="
              p-2 rounded-xl
              bg-red-500/10 border border-red-500/20
              text-red-400 hover:bg-red-500/20 hover:text-red-300
              transition-colors
            "
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-px bg-surface-elevated/30 border-b border-gold/5">
        {stats.map(({ icon, label, value, accent }) => (
          <div
            key={label}
            className="flex-1 flex items-center gap-2.5 px-5 py-3 bg-felt hover:bg-felt-light/40 transition-colors"
          >
            <span className={`${accent} opacity-70`}>{icon}</span>
            <div>
              <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                {label}
              </p>
              <p className={`text-sm font-bold ${accent}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="rounded-2xl bg-surface/95 backdrop-blur-xl border border-surface-elevated/60 shadow-2xl overflow-hidden">
            {/* Card top accent */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

            {/* Tab switcher */}
            <div className="flex p-3 gap-2 bg-surface-card/40 border-b border-surface-elevated/40">
              {([
                { key: 'join' as Tab, label: 'Join Table', icon: <DoorOpen size={14} /> },
                { key: 'create' as Tab, label: 'Create Table', icon: <Plus size={14} /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  id={`tab-${key}`}
                  onClick={() => { setTab(key); setError(''); }}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5
                    py-2.5 rounded-xl text-sm font-bold
                    border transition-all duration-200
                    ${
                      tab === key
                        ? 'bg-gold/12 border-gold/30 text-gold'
                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-surface-elevated/30'
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
                      onError={handleError}
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
                      onError={handleError}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom accent */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
          </div>

          {/* Hint footer */}
          <p className="text-center text-xs text-slate-600 mt-4">
            🎰 New accounts start with{' '}
            <span className="text-gold font-semibold">₹10,000</span> in play chips
          </p>
        </motion.div>
      </main>
    </div>
  );
};
