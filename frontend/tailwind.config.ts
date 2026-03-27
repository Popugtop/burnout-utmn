import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#0A0E1A',
          800: '#131827',
          700: '#1C2333',
          600: '#222940',
        },
        text: {
          primary: '#E8ECF4',
          secondary: '#8892A8',
          muted: '#565E73',
        },
        accent: {
          DEFAULT: '#D55B34',
          hover: '#E8744F',
          light: 'rgba(213,91,52,0.12)',
        },
        heat: {
          cold: '#1B2A4A',
          cool: '#2A5A6A',
          warm: '#C47A30',
          hot: '#D55B34',
          critical: '#E84430',
        },
        success: '#34D5A0',
        warning: '#D5A834',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
