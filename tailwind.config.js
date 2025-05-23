/** @type {import('tailwindcss').Config} */
// Salva questo file come tailwind.config.js nella root del progetto (accanto a package.json)
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        elegant: ['Outfit', 'sans-serif'],
      },
      colors: {
        bt: {
          bg: '#060b2c',
          bubble: '#ffcc00',
          highlight: '#00ffe7',
          glow: '#4f46e5',
        },
      },
      animation: {
        'spin-smooth': 'spin-smooth 1s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out forwards',
      },
      keyframes: {
        'spin-smooth': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
};