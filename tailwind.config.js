/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#E29595',
          bg: '#FFFFFF',
          text: '#1C1C1E',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        'fade-enter': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          /* `none` вместо translateY(0): иначе transform остаётся на элементе и текст часто «плывёт» в Chrome/WebKit */
          '100%': { opacity: '1', transform: 'none' },
        },
        'menu-backdrop': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'menu-sheet': {
          '0%': { opacity: '0', transform: 'translateY(-28px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'menu-dropdown': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'menu-link-drop': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'notif-backdrop': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'notif-sheet': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-enter': 'fade-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'menu-backdrop': 'menu-backdrop 0.35s ease-out both',
        'menu-sheet': 'menu-sheet 0.48s cubic-bezier(0.22, 1, 0.36, 1) both',
        'menu-dropdown': 'menu-dropdown 0.38s cubic-bezier(0.22, 1, 0.36, 1) both',
        'menu-link-drop': 'menu-link-drop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'notif-backdrop': 'notif-backdrop 0.32s ease-out both',
        'notif-sheet': 'notif-sheet 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      borderRadius: {
        card: '1.5rem',
      },
    },
  },
  plugins: [],
};
