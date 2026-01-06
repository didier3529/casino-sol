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
          DEFAULT: '#06060A',
          secondary: '#0C0C12',
          tertiary: '#12121A',
        },
        surface: {
          DEFAULT: 'rgba(18, 18, 26, 0.7)',
          elevated: 'rgba(24, 24, 34, 0.8)',
          glass: 'rgba(255, 255, 255, 0.03)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          subtle: 'rgba(255, 255, 255, 0.04)',
          accent: 'rgba(58, 243, 224, 0.2)',
        },
        accent: {
          DEFAULT: '#3AF3E0',
          hover: '#2DD4C8',
          muted: 'rgba(58, 243, 224, 0.15)',
        },
        gold: {
          DEFAULT: '#F2B950',
          muted: 'rgba(242, 185, 80, 0.15)',
        },
        success: {
          DEFAULT: '#34D399',
          muted: 'rgba(52, 211, 153, 0.15)',
        },
        error: {
          DEFAULT: '#F87171',
          muted: 'rgba(248, 113, 113, 0.15)',
        },
        warning: '#FBBF24',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
        '2xl': '28px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 40px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 30px rgba(58, 243, 224, 0.25)',
        'glow-gold': '0 0 30px rgba(242, 185, 80, 0.3)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'float': 'float 4s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
