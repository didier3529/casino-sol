/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--background)',
          secondary: 'var(--background-secondary)',
        },
        card: {
          DEFAULT: 'var(--card)',
          hover: 'var(--card-hover)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        gold: 'var(--gold)',
        silver: 'var(--silver)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        'glow-lg': 'var(--shadow-glow-lg)',
      },
    },
  },
  plugins: [],
}