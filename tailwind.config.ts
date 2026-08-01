import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        acid: '#D7FF00',
        ink: '#050505',
        coal: '#0B0B0D',
        chalk: '#F5F1E8',
        muted: '#888888'
      },
      boxShadow: {
        glow: '0 0 32px rgba(215, 255, 0, 0.22)'
      }
    }
  },
  plugins: []
};

export default config;
