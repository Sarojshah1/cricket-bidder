const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Primary brand greens
        brandGreenLight: '#00B140', // stadium vibe light green
        brandGreenDark: '#006837',  // deep premium green
        // Trophy CTA
        trophyGold: '#FFD700',
        trophyOrange: '#FF8C00',
        // Night stadium shades
        nightTeal: '#0F2027',
        nightNavy: '#203A43',
        nightBlue: '#2C5364',
        // Live/bid red gradient endpoints
        bidRedStart: '#FF512F',
        bidRedEnd: '#DD2476',
      },
      backgroundImage: {
        // Navbar & main sections
        'stadium-green': 'linear-gradient(90deg, #00B140 0%, #006837 100%)',
        // Buttons & CTAs
        'trophy-gold': 'linear-gradient(90deg, #FFD700 0%, #FF8C00 100%)',
        // App background
        'night-stadium': 'linear-gradient(180deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
        // Live data accents
        'cricket-red': 'linear-gradient(90deg, #FF512F 0%, #DD2476 100%)',
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
}; 