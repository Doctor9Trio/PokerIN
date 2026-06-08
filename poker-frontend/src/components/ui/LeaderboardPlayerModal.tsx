import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  TrendingUp,
  Coins,
  Target,
  Zap,
  Award,
} from 'lucide-react';
import type { LeaderboardEntry } from '../../api/leaderboardService';
import { normaliseTotalChips } from '../../api/leaderboardService';

// ─── Rank Config ──────────────────────────────────────────────────────────────

const RANK_CONFIG: Record<number, { label: string; ring: string; text: string; glow: string }> = {
  1: { label: '🥇', ring: 'border-gold',      text: 'text-gold',      glow: 'rgba(212,175,55,0.4)' },
  2: { label: '🥈', ring: 'border-slate-300', text: 'text-slate-200', glow: 'rgba(148,163,184,0.3)' },
  3: { label: '🥉', ring: 'border-amber-600', text: 'text-amber-500', glow: 'rgba(180,83,9,0.35)'  },
};

// ─── Radar Chart ──────────────────────────────────────────────────────────────

interface RadarAxis {
  key: string;
  label: string;
  value: number;   // 0-100 normalised
  raw: string;     // display string
  color: string;
}

interface RadarChartProps {
  axes: RadarAxis[];
}

const RadarChart: React.FC<RadarChartProps> = ({ axes }) => {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 72;
  const n = axes.length;
  const levels = 4;

  const angle = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // Grid rings
  const rings = Array.from({ length: levels }, (_, l) => {
    const r = (maxR * (l + 1)) / levels;
    const pts = axes.map((_, i) => pt(i, r));
    return pts.map((p, pi) => `${pi === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  });

  // Axes lines
  const axisLines = axes.map((_, i) => {
    const p = pt(i, maxR);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  // Data polygon
  const dataPoints = axes.map((ax, i) => pt(i, (ax.value / 100) * maxR));
  const polygon =
    dataPoints.map((p, pi) => `${pi === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + 'Z';

  // Label positions (slightly beyond maxR)
  const labelPositions = axes.map((ax, i) => {
    const p = pt(i, maxR + 22);
    return { ...p, label: ax.label, value: ax.raw, color: ax.color };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="overflow-visible"
      aria-label="Player stats radar chart"
    >
      {/* Grid rings */}
      {rings.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {axisLines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1}
          x2={l.x2} y2={l.y2}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* Data polygon filled */}
      <path
        d={polygon}
        fill="rgba(212,175,55,0.12)"
        stroke="rgba(212,175,55,0.7)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill="#d4af37"
          stroke="#0f172a"
          strokeWidth={1.5}
        />
      ))}

      {/* Axis labels */}
      {labelPositions.map((lp, i) => (
        <g key={i}>
          <text
            x={lp.x}
            y={lp.y - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight={600}
            fill="rgba(148,163,184,0.8)"
            fontFamily="Inter, sans-serif"
          >
            {lp.label}
          </text>
          <text
            x={lp.x}
            y={lp.y + 7}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight={700}
            fill={lp.color}
            fontFamily="Outfit, sans-serif"
          >
            {lp.value}
          </text>
        </g>
      ))}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2.5} fill="rgba(212,175,55,0.5)" />
    </svg>
  );
};

// ─── Stat Row ─────────────────────────────────────────────────────────────────

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
  bar?: number;      // 0-100 progress bar width
  barColor?: string;
}

const StatRow: React.FC<StatRowProps> = ({
  icon,
  label,
  value,
  accent = 'text-slate-200',
  bar,
  barColor = 'bg-gold',
}) => (
  <div className="flex items-center gap-3">
    <span className="text-slate-500 flex-shrink-0">{icon}</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
          {label}
        </span>
        <span className={`text-xs font-bold ${accent}`}>{value}</span>
      </div>
      {bar !== undefined && (
        <div className="h-1 rounded-full bg-surface-elevated/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bar}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
      )}
    </div>
  </div>
);

// ─── LeaderboardPlayerModal ───────────────────────────────────────────────────

interface LeaderboardPlayerModalProps {
  entry: LeaderboardEntry | null;
  onClose: () => void;
}

export const LeaderboardPlayerModal: React.FC<LeaderboardPlayerModalProps> = ({
  entry,
  onClose,
}) => {
  const cfg = entry ? RANK_CONFIG[entry.rank] : null;
  const isTop3 = entry ? entry.rank <= 3 : false;
  const chipsNum = entry ? normaliseTotalChips(entry) : 0;

  // Normalise stats for radar chart (0-100)
  const radarAxes = useMemo<RadarAxis[]>(() => {
    if (!entry) return [];

    const winRate = Math.min(entry.win_rate, 100);

    // Experience: cap at 200 hands = 100%
    const experience = Math.min((entry.hands_played / 200) * 100, 100);

    // Wealth: relative to ₹100K = 100%
    const wealthRaw = chipsNum;
    const wealth = Math.min((wealthRaw / 100_000) * 100, 100);

    // Efficiency: winnings / (winnings + losses), avoid divide by zero
    const w = parseFloat(entry.total_winnings) || 0;
    const l = parseFloat(entry.total_losses || '0') || 0;
    const efficiency = w + l > 0 ? Math.min((w / (w + l)) * 100, 100) : 0;

    // Aggression: avg chips won per hand (cap at ₹5K/hand = 100%)
    const aggression =
      entry.hands_played > 0
        ? Math.min((w / entry.hands_played / 5_000) * 100, 100)
        : 0;

    return [
      { key: 'winrate',     label: 'Win Rate',    value: Math.round(winRate),     raw: `${winRate.toFixed(1)}%`,   color: '#00ff88' },
      { key: 'experience',  label: 'Experience',  value: Math.round(experience),  raw: `${entry.hands_played}h`,   color: '#38bdf8' },
      { key: 'wealth',      label: 'Wealth',      value: Math.round(wealth),      raw: `₹${(wealthRaw / 1000).toFixed(0)}K`, color: '#d4af37' },
      { key: 'efficiency',  label: 'Efficiency',  value: Math.round(efficiency),  raw: `${efficiency.toFixed(0)}%`,color: '#a855f7' },
      { key: 'aggression',  label: 'Aggression',  value: Math.round(aggression),  raw: `${aggression.toFixed(0)}%`,color: '#f97316' },
    ];
  }, [entry, chipsNum]);

  return (
    <AnimatePresence>
      {entry && (
        <>
          {/* Backdrop */}
          <motion.div
            key="lb-player-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="lb-player-card"
              initial={{ opacity: 0, scale: 0.88, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 32 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="
                pointer-events-auto w-full max-w-sm
                bg-surface/97 backdrop-blur-xl
                border border-surface-elevated/60
                rounded-2xl shadow-2xl overflow-hidden
              "
              style={{
                boxShadow: isTop3 && cfg
                  ? `0 0 0 1px rgba(255,255,255,0.06), 0 25px 50px rgba(0,0,0,0.8), 0 0 40px ${cfg.glow}`
                  : '0 0 0 1px rgba(255,255,255,0.06), 0 25px 50px rgba(0,0,0,0.8)',
              }}
            >
              {/* Gold accent */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-surface-elevated/40">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-gold" />
                  <span className="text-sm font-bold text-slate-300">Player Profile</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-elevated/60 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Hero — avatar + name + rank */}
              <div className="px-5 pt-5 pb-4 border-b border-surface-elevated/30">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`
                        w-16 h-16 rounded-2xl overflow-hidden
                        flex items-center justify-center
                        border-2 font-display font-black text-2xl
                        ${isTop3 && cfg ? `${cfg.ring} ${cfg.text}` : 'border-surface-elevated text-slate-400'}
                      `}
                      style={{
                        background: isTop3
                          ? 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.03))'
                          : 'linear-gradient(135deg, #1e293b, #0f172a)',
                      }}
                    >
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        entry.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Rank badge */}
                    <div className="absolute -bottom-2 -right-2 text-base leading-none">
                      {isTop3 && cfg ? cfg.label : (
                        <span className="text-[10px] font-bold text-slate-500 bg-surface-elevated rounded-full px-1 py-0.5">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <h2 className={`font-display font-black text-lg leading-tight truncate ${isTop3 && cfg ? cfg.text : 'text-slate-100'}`}>
                      {entry.username}
                    </h2>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Rank #{entry.rank} • {entry.hands_played.toLocaleString('en-IN')} hands played
                    </p>
                    {/* Chip balance */}
                    <p className="text-xs font-bold text-gold mt-1">
                      ₹{chipsNum.toLocaleString('en-IN')} chips
                    </p>
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="flex justify-center py-3 border-b border-surface-elevated/20">
                <div className="relative">
                  {/* Glow behind chart */}
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-20"
                    style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.5), transparent 70%)' }}
                  />
                  <RadarChart axes={radarAxes} />
                </div>
              </div>

              {/* Stats list */}
              <div className="px-5 py-4 flex flex-col gap-3">
                <StatRow
                  icon={<TrendingUp size={13} />}
                  label="Win Rate"
                  value={`${entry.win_rate.toFixed(1)}%`}
                  accent={entry.win_rate >= 50 ? 'text-neon-green' : 'text-slate-300'}
                  bar={entry.win_rate}
                  barColor={entry.win_rate >= 50 ? 'bg-neon-green' : 'bg-amber-500'}
                />
                <StatRow
                  icon={<Target size={13} />}
                  label="Hands Won / Played"
                  value={`${(entry.hands_won ?? 0).toLocaleString('en-IN')} / ${entry.hands_played.toLocaleString('en-IN')}`}
                  accent="text-neon-blue"
                  bar={entry.hands_played > 0 ? ((entry.hands_won ?? 0) / entry.hands_played) * 100 : 0}
                  barColor="bg-neon-blue"
                />
                <StatRow
                  icon={<Trophy size={13} />}
                  label="Total Winnings"
                  value={`₹${parseFloat(entry.total_winnings).toLocaleString('en-IN')}`}
                  accent="text-gold"
                />
                <StatRow
                  icon={<Coins size={13} />}
                  label="Current Balance"
                  value={`₹${chipsNum.toLocaleString('en-IN')}`}
                  accent="text-slate-200"
                />
                <StatRow
                  icon={<Zap size={13} />}
                  label="Aggression (Avg win/hand)"
                  value={
                    entry.hands_played > 0
                      ? `₹${(parseFloat(entry.total_winnings) / entry.hands_played).toFixed(0)}`
                      : '—'
                  }
                  accent="text-orange-400"
                />
              </div>

              {/* Bottom accent */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
