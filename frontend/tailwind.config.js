/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Friendly & Organic Palette
        organic: {
          cream: '#FFFEF7',       // Warm white background
          beige: '#FFF9F0',       // Light beige
          sand: '#FFE8D1',        // Sand tone
          olive: {
            light: '#B5C18E',     // Light olive green
            DEFAULT: '#8B9556',   // Olive green
            dark: '#6B7446',      // Dark olive
          },
          orange: {
            light: '#FF8C42',     // Light earth orange
            DEFAULT: '#FF6B35',   // Earth orange
            dark: '#E85A2B',      // Dark orange
          },
          yellow: {
            light: '#FFE66D',     // Light yellow
            DEFAULT: '#FFDD67',   // Warm yellow
            dark: '#F4C542',      // Golden yellow
          },
          blue: {
            light: '#465B72',     // Muted blue
            DEFAULT: '#2C3E50',   // Dark blue for titles
            dark: '#1A2332',      // Very dark blue
          },
          brown: {
            light: '#C9A882',     // Light brown
            DEFAULT: '#A67C52',   // Warm brown
            dark: '#896647',      // Dark brown
          },
        },
        primary: '#FF6B35',       // Earth Orange as primary
        secondary: '#8B9556',     // Olive Green as secondary
        accent: '#FFDD67',        // Warm Yellow as accent
        danger: '#E85A2B',
        success: '#8B9556',
        warning: '#F4C542',
      },
      fontFamily: {
        'sans': ['Nunito', 'Quicksand', 'Poppins', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'Quicksand', 'sans-serif'],
        'handwritten': ['Caveat', 'Patrick Hand', 'Indie Flower', 'cursive'],
        'body': ['Nunito', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['4rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-xl': ['3.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-lg': ['2.75rem', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
        'display-md': ['2rem', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
      },
      borderRadius: {
        'organic': '2rem',
        'organic-lg': '3rem',
        'organic-xl': '4rem',
        'blob': '30% 70% 70% 30% / 60% 40% 60% 40%',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 4px 12px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'warm': '0 4px 16px rgba(255, 107, 53, 0.15)',
      },
    },
  },
  plugins: [],
}
