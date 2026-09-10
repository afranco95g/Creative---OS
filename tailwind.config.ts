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
        muted: '#888888',

        // El Culebreo — tokens del sistema de temas (funcionan en claro y oscuro)
        superficie: 'var(--superficie)',
        'superficie-elevada': 'var(--superficie-elevada)',
        'texto-principal': 'var(--texto-principal)',
        'texto-largo': 'var(--texto-largo)',
        acento: 'var(--acento)',
        borde: 'var(--borde)',

        // Bloques de acento — mismo valor en ambos temas, ver regla dura de contraste
        'rojo-base': '#9A0E0E',
        'rojo-profundo': '#4E0303',
        hueso: '#EDE9E1',
        naranja: '#FF8A1F',
        vinotinto: '#5C1A10',
        tinta: '#1A1512'
      },
      fontFamily: {
        grotesk: ['var(--font-ui)'],
        stencil: ['var(--font-mono)']
      },
      boxShadow: {
        glow: '0 0 32px rgba(215, 255, 0, 0.22)',
        stencil: '4px 4px 0 0 var(--borde)',
        'stencil-sm': '2px 2px 0 0 var(--borde)',
        'stencil-inverso': '4px 4px 0 0 var(--superficie)'
      },
      // Brutalismo: radio 0 en absolutamente todo, sin excepciones —
      // fuerza a 0 cualquier utilidad rounded-* existente en el proyecto,
      // incluyendo Creative OS y el panel admin.
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px'
      }
    }
  },
  plugins: []
};

export default config;
