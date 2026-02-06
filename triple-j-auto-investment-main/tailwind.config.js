/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tj: {
          green: '#011c12',
          gold: '#D4AF37',
          goldDim: '#8a7329',
          dark: '#000805',
          silver: '#C0C0C0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Cinzel', 'serif'],
      },
      letterSpacing: {
        ultra: '0.35em',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'gold-pulse': 'goldPulse 4s ease-in-out infinite',
        'gold-float': 'goldFloat 6s ease-in-out infinite',
        'opulent-reveal': 'opulentReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'page-enter': 'pageEnter 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'subtle-zoom': 'subtleZoom 20s ease-in-out infinite alternate',
        'spin-slow': 'spin 15s linear infinite',
        'pan-diagonal': 'panDiagonal 10s linear infinite',
        'marquee': 'marquee 35s linear infinite',
        'marquee-slow': 'marquee 50s linear infinite',
        'button-press': 'buttonPress 0.15s ease-out',
        'card-lift': 'cardLift 0.3s ease-out forwards',
        'smooth-appear': 'smoothAppear 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        goldPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.4)) brightness(1)' },
          '50%': { filter: 'drop-shadow(0 0 35px rgba(212,175,55,0.9)) brightness(1.2)' },
        },
        goldFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        opulentReveal: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.99)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        pageEnter: {
          '0%': { opacity: '0', transform: 'scale(0.98) translateY(15px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        subtleZoom: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.1)' },
        },
        panDiagonal: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
        buttonPress: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
        },
        cardLift: {
          'to': { transform: 'translateY(-4px)', boxShadow: '0 10px 40px rgba(212,175,55,0.15)' },
        },
        smoothAppear: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))'
          },
          '50%': {
            filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.9))'
          }
        },
      },
    },
  },
  plugins: [],
}
