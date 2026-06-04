/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0e1a',
          card: '#111827',
          border: '#1e293b',
          accent: '#00f0ff',
          green: '#00ff88',
          red: '#ff3355',
          amber: '#ffaa00',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
