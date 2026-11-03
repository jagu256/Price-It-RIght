/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Soft sage green – the main brand colour and the "profit" colour
        sage: {
          50: '#F3F7F1',
          100: '#E4EDE1',
          200: '#CBDCC7',
          300: '#A9C3A4',
          400: '#86A882',
          500: '#678C66',
          600: '#4F7150',
          700: '#3E5A40',
          800: '#304633',
          900: '#233425',
        },
        // Cream page background
        cream: {
          50: '#FDFBF5',
          100: '#FBF7EC',
          200: '#F3ECD8',
          300: '#E7DCBE',
        },
        // Pastel yellow – reserved for the What-If simulator and highlights
        butter: {
          100: '#FDF6D3',
          200: '#FAEDA8',
          300: '#F5DF7A',
          500: '#C9A227',
          700: '#7A6012',
        },
        // Raspberry – accessible contrasting colour used for losses
        loss: {
          50: '#FBEEF1',
          100: '#F6D9E0',
          600: '#A8324F',
          700: '#8C2741',
        },
        ink: '#1F2E22',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(35,52,37,0.06), 0 10px 28px -14px rgba(35,52,37,0.22)',
        lift: '0 2px 4px rgba(35,52,37,0.06), 0 18px 40px -18px rgba(35,52,37,0.35)',
      },
      keyframes: {
        swing: {
          '0%': { transform: 'rotate(-14deg)' },
          '45%': { transform: 'rotate(7deg)' },
          '75%': { transform: 'rotate(-3deg)' },
          '100%': { transform: 'rotate(-6deg)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        swing: 'swing 1.6s cubic-bezier(.3,.7,.4,1) both',
        rise: 'rise .45s ease-out both',
      },
    },
  },
  plugins: [],
};
