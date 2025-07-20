import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#1a202c',
          900: '#0f172a',
          950: '#020617',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
        'celebrate-bg': 'celebrationBg 2s ease-in-out',
        'celebrate-pulse': 'celebrationPulse 0.5s ease-in-out 4',
        'pop-in': 'popIn 0.5s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        celebrationBg: {
          '0%': { background: 'linear-gradient(135deg, rgb(30, 27, 75), rgb(49, 46, 129))' },
          '5%': { background: 'linear-gradient(135deg, #059669, #10B981, #34D399)' },
          '95%': { background: 'linear-gradient(135deg, #059669, #10B981, #34D399)' },
          '100%': { background: 'linear-gradient(135deg, rgb(30, 27, 75), rgb(49, 46, 129))' },
        },
        celebrationPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.01)' },
          '100%': { transform: 'scale(1)' },
        },
        popIn: {
          '0%': { transform: 'translate(-50%, -50%) scale(0)' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.2)' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;