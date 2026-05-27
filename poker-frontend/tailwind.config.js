/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Casino dark palette
        felt: {
          DEFAULT: '#0d1f15',
          light: '#13291c',
          border: '#1e4030',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f0cc5a',
          glow: 'rgba(212,175,55,0.3)',
        },
        neon: {
          green: '#00ff88',
          purple: '#a855f7',
          blue: '#38bdf8',
        },
        chip: {
          blue: '#3b82f6',
          red: '#ef4444',
          green: '#22c55e',
          black: '#1c1917',
          purple: '#a855f7',
        },
        surface: {
          DEFAULT: '#0f172a',
          card: '#1e293b',
          elevated: '#334155',
        },
      },
      boxShadow: {
        'felt-inner': 'inset 0 0 60px rgba(0,0,0,0.6), inset 0 0 30px rgba(212,175,55,0.08)',
        'gold-glow': '0 0 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.2)',
        'neon-green': '0 0 15px rgba(0,255,136,0.5), 0 0 30px rgba(0,255,136,0.2)',
        'player-active': '0 0 0 3px #00ff88, 0 0 20px rgba(0,255,136,0.4)',
        'card': '2px 4px 12px rgba(0,0,0,0.6)',
        'chip': '2px 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'heartbeat': 'heartbeat 0.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 3px #00ff88, 0 0 20px rgba(0,255,136,0.4)' },
          '50%': { boxShadow: '0 0 0 3px #00ff88, 0 0 40px rgba(0,255,136,0.7)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
