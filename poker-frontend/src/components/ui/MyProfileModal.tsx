import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  TrendingUp,
  Trophy,
  Coins,
  Target,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Palette,
  Upload,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { fetchMyProfile, uploadAvatar } from '../../api/profileService';
import type { MyProfileData } from '../../api/profileService';

// ─── Preset Avatars ───────────────────────────────────────────────────────────

interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  ring: string;
}

const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'shark',   label: 'The Shark',     emoji: '🦈', gradient: 'linear-gradient(135deg, #1e3a5f, #0d1f3c)', ring: '#38bdf8' },
  { id: 'king',    label: 'The King',      emoji: '👑', gradient: 'linear-gradient(135deg, #4a3300, #2d1f00)', ring: '#d4af37' },
  { id: 'devil',   label: "Devil's Luck",  emoji: '😈', gradient: 'linear-gradient(135deg, #7f1d1d, #450a0a)', ring: '#ef4444' },
  { id: 'ninja',   label: 'The Ninja',     emoji: '🥷', gradient: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)', ring: '#a855f7' },
  { id: 'fire',    label: 'Firestarter',   emoji: '🔥', gradient: 'linear-gradient(135deg, #7c2d12, #1c0701)', ring: '#f97316' },
  { id: 'diamond', label: 'Diamond Hand',  emoji: '💎', gradient: 'linear-gradient(135deg, #0f2a4a, #061220)', ring: '#67e8f9' },
  { id: 'skull',   label: 'Deadman',       emoji: '💀', gradient: 'linear-gradient(135deg, #27272a, #0d0d0d)', ring: '#94a3b8' },
  { id: 'robot',   label: 'Bot Crusher',   emoji: '🤖', gradient: 'linear-gradient(135deg, #0f3020, #061510)', ring: '#00ff88' },
  { id: 'fox',     label: 'Sly Fox',       emoji: '🦊', gradient: 'linear-gradient(135deg, #5c2d0e, #2d1200)', ring: '#fb923c' },
  { id: 'cowboy',  label: 'The Cowboy',    emoji: '🤠', gradient: 'linear-gradient(135deg, #44250e, #22110a)', ring: '#a16207' },
  { id: 'luck',    label: 'Lady Luck',     emoji: '🍀', gradient: 'linear-gradient(135deg, #14532d, #052e16)', ring: '#4ade80' },
  { id: 'joker',   label: 'The Joker',     emoji: '🃏', gradient: 'linear-gradient(135deg, #581c87, #2e0f47)', ring: '#c084fc' },
];

// Convert a preset to a canvas-based PNG Blob for uploading
async function presetToBlob(preset: AvatarPreset): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('No canvas context')); return; }

    // Parse gradient stops from CSS string
    const colorMatches = preset.gradient.match(/#[0-9a-fA-F]{6}/g) || ['#1e293b', '#0f172a'];
    const grad = ctx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, colorMatches[0]);
    grad.addColorStop(1, colorMatches[1] || colorMatches[0]);

    // Fill background
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 200, 200, 40);
    ctx.fill();

    // Draw emoji
    ctx.font = '90px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(preset.emoji, 100, 105);

    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
}

// ─── PresetAvatarGrid ─────────────────────────────────────────────────────────

interface PresetGridProps {
  currentId: string | null;
  onSelect: (preset: AvatarPreset) => void;
  uploading: boolean;
}

const PresetAvatarGrid: React.FC<PresetGridProps> = ({
  currentId,
  onSelect,
  uploading,
}) => (
  <div className="grid grid-cols-4 gap-2">
    {AVATAR_PRESETS.map((preset) => (
      <button
        key={preset.id}
        onClick={() => onSelect(preset)}
        disabled={uploading}
        title={preset.label}
        aria-label={`Select ${preset.label} avatar`}
        className={`
          relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5
          border-2 transition-all duration-200 group overflow-hidden
          disabled:cursor-not-allowed
          ${currentId === preset.id
            ? 'border-gold shadow-gold-glow scale-105'
            : 'border-transparent hover:border-white/20 hover:scale-105'
          }
        `}
        style={{ background: preset.gradient }}
      >
        <span className="text-2xl leading-none">{preset.emoji}</span>
        <span className="text-[8px] font-semibold text-white/70 truncate w-full text-center px-0.5">
          {preset.label.split(' ').pop()}
        </span>
        {currentId === preset.id && (
          <div className="absolute top-1 right-1">
            <CheckCircle2 size={10} className="text-gold" />
          </div>
        )}
      </button>
    ))}
  </div>
);

// ─── Custom Upload Section ─────────────────────────────────────────────────────

interface CustomUploadProps {
  avatarUrl: string | null;
  username: string;
  uploading: boolean;
  onUploadClick: () => void;
}

const CustomUpload: React.FC<CustomUploadProps> = ({
  avatarUrl,
  username,
  uploading,
  onUploadClick,
}) => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative inline-flex group">
      <div
        className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gold/40 flex items-center justify-center"
        style={{
          background: avatarUrl
            ? undefined
            : 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05))',
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="font-display font-black text-4xl text-gold">
            {username.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <button
        onClick={onUploadClick}
        disabled={uploading}
        className="
          absolute inset-0 rounded-2xl
          bg-black/0 group-hover:bg-black/50
          flex items-center justify-center
          transition-all duration-200 disabled:cursor-not-allowed
        "
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
          {uploading ? (
            <Loader2 size={22} className="text-white animate-spin" />
          ) : (
            <>
              <Camera size={22} className="text-white" />
              <span className="text-[10px] font-bold text-white">Change</span>
            </>
          )}
        </div>
      </button>
      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neon-green border-2 border-surface" />
    </div>
    <button
      onClick={onUploadClick}
      disabled={uploading}
      className="
        flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
        bg-gold/10 border border-gold/25 text-gold
        hover:bg-gold/20 disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      "
    >
      <Upload size={12} />
      Upload Photo
    </button>
    <p className="text-[10px] text-slate-700">JPG, PNG, WEBP or GIF · Max 5 MB</p>
  </div>
);

// ─── Feedback Badge ────────────────────────────────────────────────────────────

interface FeedbackBadgeProps {
  type: 'success' | 'error';
  message: string;
}

const FeedbackBadge: React.FC<FeedbackBadgeProps> = ({ type, message }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
      type === 'success'
        ? 'bg-neon-green/10 border border-neon-green/25 text-neon-green'
        : 'bg-red-500/10 border border-red-500/20 text-red-400'
    }`}
  >
    {type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
    {message}
  </motion.div>
);

// ─── Stat Tile ────────────────────────────────────────────────────────────────

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
  subValue?: string;
}

const StatTile: React.FC<StatTileProps> = ({
  icon,
  label,
  value,
  accent = 'text-slate-300',
  subValue,
}) => (
  <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-card/60 border border-surface-elevated/50 min-w-0">
    <span className="text-slate-500">{icon}</span>
    <span className={`text-base font-black font-display ${accent}`}>{value}</span>
    {subValue && (
      <span className="text-[9px] text-slate-600 font-medium">{subValue}</span>
    )}
    <span className="text-[10px] text-slate-600 font-medium text-center leading-tight">
      {label}
    </span>
  </div>
);

// ─── MyProfileModal ───────────────────────────────────────────────────────────

type AvatarTab = 'presets' | 'upload';

export const MyProfileModal: React.FC = () => {
  const { closeModal } = useUIStore();
  const { username, avatarUrl, setAvatarUrl, setBalance } = useAuthStore();

  const [profile, setProfile] = useState<MyProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [avatarTab, setAvatarTab] = useState<AvatarTab>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyProfile();
      setProfile(data);
      if (data.wallet?.balance) setBalance(data.wallet.balance);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
    } catch {
      setError('Could not load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setBalance, setAvatarUrl]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const showFeedback = (f: { type: 'success' | 'error'; message: string }) => {
    setFeedback(f);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFeedback(null);
    try {
      const newUrl = await uploadAvatar(file);
      setAvatarUrl(newUrl);
      setProfile((prev) => prev ? { ...prev, avatar_url: newUrl } : prev);
      setSelectedPresetId(null);
      showFeedback({ type: 'success', message: 'Profile photo updated!' });
    } catch (err: any) {
      showFeedback({ type: 'error', message: err.response?.data?.error || 'Upload failed.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePresetSelect = async (preset: AvatarPreset) => {
    if (uploading) return;
    setUploading(true);
    setFeedback(null);
    try {
      const blob = await presetToBlob(preset);
      const file = new File([blob], `preset-${preset.id}.png`, { type: 'image/png' });
      const newUrl = await uploadAvatar(file);
      setAvatarUrl(newUrl);
      setProfile((prev) => prev ? { ...prev, avatar_url: newUrl } : prev);
      setSelectedPresetId(preset.id);
      showFeedback({ type: 'success', message: `${preset.label} avatar set!` });
    } catch {
      showFeedback({ type: 'error', message: 'Failed to set preset avatar.' });
    } finally {
      setUploading(false);
    }
  };

  const displayAvatar = profile?.avatar_url ?? avatarUrl;
  const displayUsername = profile?.username ?? username ?? '';
  const stats = profile?.stats;
  const wallet = profile?.wallet;

  const formattedBalance = wallet?.balance
    ? `₹${parseFloat(wallet.balance).toLocaleString('en-IN')}`
    : '—';
  const formattedWinnings = stats?.total_winnings
    ? `₹${parseFloat(stats.total_winnings).toLocaleString('en-IN')}`
    : '₹0';
  const formattedWinRate = stats ? `${stats.win_rate.toFixed(1)}%` : '—';

  const joinedDate = profile?.date_joined
    ? new Date(profile.date_joined).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="
            pointer-events-auto w-full max-w-sm
            bg-surface/96 backdrop-blur-xl
            border border-surface-elevated/60
            rounded-2xl shadow-2xl overflow-hidden
            max-h-[92vh] flex flex-col
          "
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-elevated/40 flex-shrink-0">
            <div className="flex items-center gap-3">
              <User size={18} className="text-gold" />
              <h2 className="font-display font-bold text-slate-100 text-base">My Profile</h2>
            </div>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-elevated/60 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body (scrollable) */}
          <div className="overflow-y-auto flex-1">
            <div className="px-5 py-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 size={28} className="text-gold animate-spin" />
                  <p className="text-sm text-slate-500">Loading profile…</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <AlertCircle size={28} className="text-red-400" />
                  <p className="text-sm text-slate-400">{error}</p>
                  <button
                    onClick={loadProfile}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gold/10 border border-gold/25 text-gold hover:bg-gold/20 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Username + joined */}
                  <div className="text-center">
                    <h3 className="font-display font-black text-xl text-slate-100 tracking-tight">
                      {displayUsername}
                    </h3>
                    {joinedDate && (
                      <p className="text-xs text-slate-600 mt-0.5">Member since {joinedDate}</p>
                    )}
                  </div>

                  {/* Avatar section — tabbed */}
                  <div className="rounded-xl border border-surface-elevated/50 overflow-hidden">
                    {/* Tab switcher */}
                    <div className="flex p-1 gap-1 bg-surface-card/40 border-b border-surface-elevated/30">
                      {[
                        { key: 'presets' as AvatarTab, label: 'Choose Preset', icon: <Palette size={12} /> },
                        { key: 'upload'  as AvatarTab, label: 'Upload Photo',  icon: <Upload size={12} /> },
                      ].map(({ key, label, icon }) => (
                        <button
                          key={key}
                          onClick={() => setAvatarTab(key)}
                          className={`
                            flex-1 flex items-center justify-center gap-1.5
                            py-2 rounded-lg text-xs font-bold transition-all duration-150
                            ${avatarTab === key
                              ? 'bg-gold/15 border border-gold/30 text-gold'
                              : 'text-slate-500 hover:text-slate-300 border border-transparent'
                            }
                          `}
                        >
                          {icon}{label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4">
                      <AnimatePresence mode="wait">
                        {avatarTab === 'presets' ? (
                          <motion.div
                            key="presets"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ duration: 0.15 }}
                          >
                            <PresetAvatarGrid
                              currentId={selectedPresetId}
                              onSelect={handlePresetSelect}
                              uploading={uploading}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="upload"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                          >
                            <CustomUpload
                              avatarUrl={displayAvatar}
                              username={displayUsername}
                              uploading={uploading}
                              onUploadClick={() => fileInputRef.current?.click()}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {feedback && (
                        <div className="px-4 pb-3">
                          <FeedbackBadge type={feedback.type} message={feedback.message} />
                        </div>
                      )}
                      {uploading && !feedback && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="px-4 pb-3 flex items-center gap-2 text-xs text-slate-500"
                        >
                          <Loader2 size={12} className="animate-spin" />
                          Uploading avatar…
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Stats grid */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Your Stats
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <StatTile
                        icon={<Coins size={15} />}
                        label="Current Balance"
                        value={formattedBalance}
                        accent="text-gold"
                      />
                      <StatTile
                        icon={<Trophy size={15} />}
                        label="Total Winnings"
                        value={formattedWinnings}
                        accent="text-neon-green"
                      />
                      <StatTile
                        icon={<TrendingUp size={15} />}
                        label="Win Rate"
                        value={formattedWinRate}
                        accent="text-neon-blue"
                        subValue={
                          stats && stats.hands_played > 0
                            ? `${stats.hands_won}/${stats.hands_played} hands`
                            : undefined
                        }
                      />
                      <StatTile
                        icon={<Target size={15} />}
                        label="Hands Played"
                        value={stats ? stats.hands_played.toLocaleString('en-IN') : '0'}
                        accent="text-slate-300"
                      />
                    </div>
                  </div>

                  {stats && stats.hands_played === 0 && (
                    <p className="text-center text-xs text-slate-600">
                      🃏 Play your first hand to see your stats!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent flex-shrink-0" />
        </motion.div>
      </div>
    </>
  );
};
