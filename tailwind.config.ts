import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { acid: '#d7ff00', ink: '#050505', card: '#101010' }, boxShadow: { glow: '0 0 30px rgba(215,255,0,.25)' } } }, plugins: [] };
export default config;
