import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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