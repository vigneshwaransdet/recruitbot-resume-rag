/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // RecruitBot brand — Professional Blue
        primary: '#2563eb',
        accent: '#06b6d4',
        // Backgrounds (cool blue-gray, dark theme)
        'bg-base': '#0b1120',
        'bg-surface': '#111a2e',
        'bg-card': '#172136',
        // Text
        'text-primary': '#f1f5f9',
        'text-muted': '#94a3b8',
        // Search mode scores (distinct, readable on dark)
        'score-vector': '#3b82f6',
        'score-bm25': '#22d3ee',
        'score-hybrid': '#34d399',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'dot-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200%' },
          '100%': { backgroundPosition: '200%' },
        },
      },
      animation: {
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
        'dot-bounce': 'dot-bounce 0.6s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
