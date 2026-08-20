import type { Config } from 'tailwindcss';

/**
 * Design tokens for FIRST SCENE.
 *
 * The palette is "analog future": a near-black stage, warm paper for anything
 * physical, and exactly three signal colours. Cobalt means *chosen*. Pink means
 * *human/wrong-fit warmth*. Mint is reserved for the system layer and appears
 * nowhere in the consumer surface — that separation is the point.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#08090C',
          soft: '#101219',
          raised: '#171A23',
          line: '#252935',
        },
        paper: {
          DEFAULT: '#F2EEE3',
          bright: '#FBF9F3',
          dim: '#D8D2C2',
          shadow: '#B8B0A0',
        },
        cobalt: {
          DEFAULT: '#2B44FF',
          deep: '#0E1C9E',
          glow: '#5C6CFF',
        },
        acid: {
          DEFAULT: '#FF2E88',
          deep: '#C4004F',
        },
        ticket: '#FFD84D',
        mint: '#5FE3AE',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        hand: ['var(--font-hand)', 'Segoe Script', 'cursive'],
      },
      fontSize: {
        // Editorial scale — clamped so the hero never needs a media query.
        'hero': ['clamp(2.75rem, 11vw, 9rem)', { lineHeight: '0.86', letterSpacing: '-0.03em' }],
        'display': ['clamp(1.75rem, 5.5vw, 4rem)', { lineHeight: '0.92', letterSpacing: '-0.02em' }],
        'lede': ['clamp(1.05rem, 2.2vw, 1.6rem)', { lineHeight: '1.24', letterSpacing: '-0.01em' }],
        'label': ['0.6875rem', { lineHeight: '1.1', letterSpacing: '0.18em' }],
        'micro': ['0.625rem', { lineHeight: '1.2', letterSpacing: '0.14em' }],
      },
      spacing: {
        gutter: 'clamp(1rem, 3.5vw, 3.5rem)',
      },
      borderRadius: {
        artifact: '2px',
        sheet: '14px',
      },
      boxShadow: {
        artifact: '0 18px 40px -22px rgba(0,0,0,0.85), 0 2px 6px -2px rgba(0,0,0,0.6)',
        lift: '0 30px 70px -30px rgba(0,0,0,0.9)',
        tape: '0 4px 12px -6px rgba(0,0,0,0.7)',
      },
      transitionTimingFunction: {
        // One easing vocabulary, used everywhere. `settle` is the physical one.
        settle: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snap: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
      },
      transitionDuration: {
        tick: '120ms',
        settle: '520ms',
        scene: '820ms',
      },
      zIndex: {
        stage: '10',
        artifacts: '20',
        overlay: '30',
        sheet: '40',
        disclosure: '50',
      },
      keyframes: {
        'tape-in': {
          '0%': { opacity: '0', transform: 'translateY(14px) rotate(var(--tape-rot, -1.5deg)) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(var(--tape-rot, -1.5deg)) scale(1)' },
        },
        'receipt-feed': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'caret': {
          '0%, 45%': { opacity: '1' },
          '50%, 95%': { opacity: '0' },
        },
      },
      animation: {
        'tape-in': 'tape-in 520ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'caret': 'caret 1.1s steps(1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
