/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,scss}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Flipkart-style brand palette
        primary: {
          50:  '#e8f0fe',
          100: '#c5d8fd',
          200: '#9fbcfb',
          300: '#6f9bf7',
          400: '#4a7ef4',
          500: '#2874F0',  // Flipkart blue
          600: '#1a66e0',
          700: '#1254c4',
          800: '#0d42a0',
          900: '#082e7a',
          950: '#041b52',
        },
        accent: {
          DEFAULT: '#FB641B',  // Flipkart orange
          light:   '#fde8d8',
          dark:    '#e0530d',
        },
        fk: {
          yellow:  '#FFE500',
          green:   '#388E3C',
          red:     '#FF6161',
          grey:    '#F1F3F6',
          text:    '#212121',
          muted:   '#878787',
          border:  '#F0F0F0',
        },
        success:  '#388E3C',
        warning:  '#FF9F00',
        error:    '#FF6161',
        info:     '#2874F0',

        surface: {
          50:  '#F1F3F6',
          100: '#e8eaf0',
          200: '#dde0e8',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      borderRadius: {
        '4xl': '2rem',
      },

      boxShadow: {
        'fk-card':    '0 2px 4px 0 rgba(0,0,0,.08)',
        'fk-card-hover': '0 4px 16px 0 rgba(40,116,240,.18)',
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'elevation-2': '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        'elevation-3': '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
        'glass':      '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      },

      backdropBlur: {
        xs: '2px',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },

      animation: {
        'fade-in':        'fade-in 0.3s ease-out both',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':       'scale-in 0.2s ease-out both',
        shimmer:          'shimmer 1.6s linear infinite',
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      zIndex: {
        'sticky':   '100',
        'overlay':  '200',
        'modal':    '300',
        'toast':    '400',
        'tooltip':  '500',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
