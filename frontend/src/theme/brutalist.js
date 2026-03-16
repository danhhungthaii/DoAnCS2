/**
 * BRUTALIST BOLD & MODERN THEME
 * Phong cách táo bạo, hiện đại với tương phản cao
 */

const brutalistTheme = {
  // Core Colors - High Contrast
  colors: {
    black: '#000000',
    white: '#FFFFFF',
    neon: '#FFFF00',        // Neon Yellow - Primary Accent
    neonAlt: '#00FF00',     // Neon Green - Secondary Accent
    gray: '#222222',
    grayLight: '#333333',
    red: '#FF0000',
  },

  // Typography - Bold & Industrial
  typography: {
    fontFamily: {
      brutalist: "'Arial Black', 'Impact', sans-serif",
      industrial: "'Courier New', monospace",
    },
    fontSize: {
      mega: '8rem',      // 128px
      ultra: '6rem',     // 96px
      huge: '4rem',      // 64px
      xxl: '3rem',       // 48px
      xl: '2.5rem',      // 40px
      lg: '2rem',        // 32px
      md: '1.5rem',      // 24px
      base: '1rem',      // 16px
      sm: '0.875rem',    // 14px
    },
    fontWeight: {
      black: 900,
      bold: 700,
      normal: 400,
    },
  },

  // Borders - Thick & Bold
  borders: {
    thin: '3px',
    thick: '6px',
    ultra: '10px',
  },

  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    xxl: '4rem',
  },

  // Shadows - Hard Shadows Only
  shadows: {
    small: '4px 4px 0',
    medium: '8px 8px 0',
    large: '12px 12px 0',
    xlarge: '16px 16px 0',
  },

  // Component Styles
  components: {
    button: {
      primary: {
        background: '#000000',
        color: '#FFFF00',
        border: '6px solid #000000',
        boxShadow: '8px 8px 0 #FFFF00',
        padding: '1.5rem 3rem',
        fontSize: '1.5rem',
        fontWeight: 900,
        textTransform: 'uppercase',
      },
      secondary: {
        background: '#FFFFFF',
        color: '#000000',
        border: '6px solid #000000',
        boxShadow: '8px 8px 0 #000000',
        padding: '1.5rem 3rem',
        fontSize: '1.5rem',
        fontWeight: 900,
        textTransform: 'uppercase',
      },
      neon: {
        background: '#FFFF00',
        color: '#000000',
        border: '6px solid #000000',
        boxShadow: '8px 8px 0 #000000',
        padding: '1.5rem 3rem',
        fontSize: '1.5rem',
        fontWeight: 900,
        textTransform: 'uppercase',
      },
    },
    card: {
      default: {
        background: '#FFFFFF',
        border: '6px solid #000000',
        boxShadow: '12px 12px 0 #000000',
      },
      hover: {
        transform: 'translate(-4px, -4px)',
        boxShadow: '16px 16px 0 #000000',
      },
      neon: {
        background: '#FFFF00',
        border: '6px solid #000000',
        boxShadow: '12px 12px 0 #000000',
      },
    },
    input: {
      default: {
        background: '#FFFFFF',
        border: '6px solid #000000',
        padding: '1rem 1.5rem',
        fontSize: '1.25rem',
        fontWeight: 700,
      },
      focus: {
        border: '6px solid #FFFF00',
        boxShadow: '0 0 0 4px #FFFF00',
      },
    },
  },

  // Layout
  layout: {
    maxWidth: '1400px',
    headerHeight: '80px',
    sidebarWidth: '280px',
  },

  // Transitions - Fast & Snappy
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};

export default brutalistTheme;
