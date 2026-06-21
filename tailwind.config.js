/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        contract: {
          bg: "#0F172A",
          bgSecondary: "#1E293B",
          bgCard: "#1E293B",
          border: "#334155",
          text: "#F1F5F9",
          textSecondary: "#94A3B8",
          accent: "#3B82F6",
        },
        risk: {
          high: "#DC2626",
          highBg: "#FEE2E2",
          highBgDark: "#450A0A",
          medium: "#F59E0B",
          mediumBg: "#FEF3C7",
          mediumBgDark: "#451A03",
          low: "#EAB308",
          lowBg: "#FEF9C3",
          lowBgDark: "#422006",
          info: "#059669",
          infoBg: "#D1FAE5",
          infoBgDark: "#022C22",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.2s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
