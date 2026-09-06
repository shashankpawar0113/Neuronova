/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FCFAF7',
          100: '#FAF7F2',
          200: '#F3ECE1',
          300: '#E8DCB',
          400: '#DCC8B3',
        },
        forest: {
          50: '#EEF5F0',
          100: '#D9E8DC',
          200: '#B6D3BD',
          500: '#2A6B3D',
          600: '#1E4D2B',
          700: '#173D22',
          800: '#112C19',
          900: '#0C2012',
        },
        muga: {
          50: '#FDFBF7',
          100: '#F8EFE3',
          200: '#EEDAC2',
          300: '#E2C29E',
          400: '#D4A373',
          500: '#C58F5B',
          600: '#AA7543',
        },
        river: {
          50: '#EDF7F6',
          100: '#D5EDEB',
          400: '#3DB4A5',
          500: '#2A9D8F',
          600: '#228176',
          700: '#196158',
        },
        charcoal: {
          800: '#242C38',
          900: '#1A202C',
          950: '#11161F',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulseSlow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
