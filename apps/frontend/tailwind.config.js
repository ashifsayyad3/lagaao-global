/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Brand: deep forest green ──────────────────────────
        primary: {
          50:  '#f0f7f1',
          100: '#d8ecdb',
          200: '#b3d6b8',
          300: '#82ba89',
          400: '#5a9962',
          500: '#3d6b45',   // main
          600: '#2f5436',
          700: '#274530',
          800: '#1e3326',
          900: '#14231a',
          950: '#0b1510',
        },
        // ── Accent: warm terracotta ───────────────────────────
        terracotta: {
          50:  '#fdf3ef',
          100: '#fae3d8',
          200: '#f5c5af',
          300: '#eda07f',
          400: '#e07f5a',
          500: '#c8603a',   // main
          600: '#a04828',
          700: '#7e371e',
          800: '#5c2817',
          900: '#3b1a0f',
        },
        // ── Sage ──────────────────────────────────────────────
        sage: {
          50:  '#f4f8f4',
          100: '#e4ede5',
          200: '#c6d9c8',
          300: '#a8c4ab',
          400: '#8aaf8e',
          500: '#7a9e7e',
          600: '#5a7d5e',
          700: '#466050',
          800: '#334840',
          900: '#1e3028',
        },
        // ── Warm neutrals ─────────────────────────────────────
        cream:  '#faf6f0',
        linen:  '#f2ebe0',
        sand:   '#e8ddd0',
        stone:  '#c4b8a8',

        // ── Semantic ──────────────────────────────────────────
        success: '#3d6b45',
        warning: '#d4880a',
        error:   '#c0392b',
        info:    '#2e7d9f',

        // ── Surface for dark mode ─────────────────────────────
        surface: {
          50:  '#faf6f0',
          100: '#f2ebe0',
          200: '#e8ddd0',
          800: '#2f3d33',
          900: '#1e2d22',
          950: '#111a14',
        },
      },

      fontFamily: {
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif:   ['"DM Serif Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },

      boxShadow: {
        'plant':      '0 2px 12px rgba(61,107,69,.08), 0 0 0 1px rgba(61,107,69,.06)',
        'plant-hover':'0 8px 32px rgba(61,107,69,.16), 0 0 0 1px rgba(61,107,69,.10)',
        'warm-sm':    '0 2px 8px rgba(61,107,69,.08)',
        'warm-md':    '0 4px 16px rgba(61,107,69,.10)',
        'warm-lg':    '0 8px 32px rgba(61,107,69,.12)',
        'warm-xl':    '0 16px 48px rgba(61,107,69,.14)',
        'elevation-1':'0 1px 3px rgba(0,0,0,.08)',
        'elevation-2':'0 3px 8px rgba(0,0,0,.10)',
        'elevation-3':'0 8px 24px rgba(0,0,0,.12)',
      },

      zIndex: {
        'dropdown': '100',
        'sticky':   '200',
        'overlay':  '300',
        'modal':    '400',
        'toast':    '500',
      },

      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'leaf-sway': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%':      { transform: 'rotate(2deg)' },
        },
      },

      animation: {
        'fade-up':   'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':   'fade-in 0.3s ease-out both',
        'slide-down':'slide-down 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':  'scale-in 0.2s ease-out both',
        shimmer:     'shimmer 1.8s linear infinite',
        'leaf-sway': 'leaf-sway 3s ease-in-out infinite',
      },

      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
