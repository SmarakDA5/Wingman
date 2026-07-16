/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '14px' }],
        'sm': ['13px', { lineHeight: '16px' }],
        'base': ['15px', { lineHeight: '20px' }],
        'lg': ['17px', { lineHeight: '22px' }],
        'xl': ['20px', { lineHeight: '25px' }],
        '2xl': ['24px', { lineHeight: '29px' }],
        '3xl': ['28px', { lineHeight: '34px' }],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'touch': '44pt',
      },
      minHeight: {
        'touch': '44pt',
      },
      minWidth: {
        'touch': '44pt',
      },
      backdropBlur: {
        'glass': '16px',
      },
    },
  },
  plugins: [],
}

