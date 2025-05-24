/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      transitionProperty: {
        'all': 'all',
      },
      duration: {
        '350': '350ms',
      },
      
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
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(.48,1.54,.53,0.95)',
        'pop-in': 'pop-in 0.66s cubic-bezier(.45,1.8,.47,0.81)',
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
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.5)' },
          '80%': { opacity: 1, transform: 'scale(1.09)' },
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
