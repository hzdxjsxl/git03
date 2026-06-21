/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'dashboard': {
          'bg': '#0a1628',
          'card': 'rgba(15, 23, 42, 0.3)',
          'border': 'rgba(51, 65, 85, 0.5)',
          'primary': '#3b82f6',
          'positive': '#10b981',
          'negative': '#ef4444',
          'neutral': '#64748b',
          'warning': '#f59e0b'
        }
      },
      fontFamily: {
        'display': ['Space Grotesk', 'Noto Sans SC', 'sans-serif'],
        'body': ['Noto Sans SC', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.5s ease-out forwards'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' }
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
};
