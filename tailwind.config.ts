import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aqua: {
          50: '#ecfdff', 100: '#d0f7fd', 200: '#a5eefa', 300: '#67dff3', 400: '#25c6e3',
          500: '#0aa9c9', 600: '#0b87a8', 700: '#106c88', 800: '#16566e', 900: '#17475c',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
