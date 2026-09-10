/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: '#F0F7FA',
          100: '#E1EFF5',
          200: '#C2DFEB',
          500: '#0284C7',
          600: '#0369A1',
          700: '#075985',
          800: '#0C4A6E',
          900: '#082F49',
        },
      },
      fontFamily: {
        'brand-heading': ['Outfit', 'sans-serif'],
        'brand-body': ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
