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
          300: '#E8DCB8',
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
        terracotta: {
          50: '#FAF3EE',
          100: '#F4E4D7',
          200: '#E7C7AF',
          400: '#C97D54',
          500: '#B86B43',
          600: '#9C5632',
          700: '#7F4224',
        },
        charcoal: {
          800: '#242C38',
          900: '#1A202C',
          950: '#11161F',
        },
      },
      fontFamily: {
        'brand-heading': ['Outfit', 'sans-serif'],
        'brand-body': ['Plus Jakarta Sans', 'sans-serif'],
      },
      minHeight: {
        'touch': '56px',
      },
      minWidth: {
        'touch': '56px',
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -1px rgba(30, 77, 43, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)',
        'warm-md': '0 8px 24px -4px rgba(30, 77, 43, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'warm-lg': '0 16px 36px -6px rgba(30, 77, 43, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
