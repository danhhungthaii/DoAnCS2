/**
 * FRIENDLY & ORGANIC DESIGN SYSTEM
 * Warm, Approachable, Human-Centered Design
 * 
 * Philosophy:
 * - Create warmth and trust through organic shapes and warm colors
 * - Use rounded, friendly typography
 * - Incorporate illustrations and human elements
 * - Emphasize approachability and creativity
 */

const organicTheme = {
  // Warm Color Palette
  colors: {
    // Primary warm tones
    cream: '#FFFEF7',
    beige: '#FFF9F0',
    sand: '#FFE8D1',
    
    // Earth tones
    olive: {
      light: '#B5C18E',
      default: '#8B9556',
      dark: '#6B7446',
    },
    
    orange: {
      light: '#FF8C42',
      default: '#FF6B35',  // Primary action color
      dark: '#E85A2B',
    },
    
    yellow: {
      light: '#FFE66D',
      default: '#FFDD67',
      dark: '#F4C542',
    },
    
    blue: {
      light: '#465B72',
      default: '#2C3E50',  // Text color
      dark: '#1A2332',
    },
    
    brown: {
      light: '#C9A882',
      default: '#A67C52',
      dark: '#896647',
    },
    
    // Semantic colors
    primary: '#FF6B35',     // Earth Orange
    secondary: '#8B9556',   // Olive Green
    accent: '#FFDD67',      // Warm Yellow
    success: '#8B9556',
    warning: '#F4C542',
    danger: '#E85A2B',
    info: '#465B72',
  },

  // Friendly Typography
  typography: {
    fontFamily: {
      body: "'Nunito', 'Quicksand', 'Poppins', system-ui, sans-serif",
      display: "'Poppins', 'Quicksand', sans-serif",
      handwritten: "'Caveat', 'Patrick Hand', 'Indie Flower', cursive",
    },
    
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.7,
      loose: 2,
    },
  },

  // Organic Spacing - Flexible and Natural
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2.5rem',    // 40px
    xl: '4rem',      // 64px
    '2xl': '6rem',   // 96px
    '3xl': '8rem',   // 128px
  },

  // Rounded Borders - Friendly Curves
  borderRadius: {
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    full: '9999px',
    blob: '30% 70% 70% 30% / 60% 40% 60% 40%',
    blobAlt: '40% 60% 60% 40% / 50% 50% 50% 50%',
  },

  // Soft Shadows - Subtle and Warm
  shadows: {
    none: 'none',
    soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
    softMd: '0 4px 12px rgba(0, 0, 0, 0.06)',
    softLg: '0 8px 24px rgba(0, 0, 0, 0.08)',
    warm: '0 4px 16px rgba(255, 107, 53, 0.15)',
    warmLg: '0 8px 32px rgba(255, 107, 53, 0.2)',
    olive: '0 4px 16px rgba(139, 149, 86, 0.15)',
  },

  // Component Styles
  components: {
    // Buttons
    button: {
      primary: {
        background: '#FF6B35',
        color: '#FFFFFF',
        borderRadius: '2rem',
        padding: '1rem 2rem',
        fontSize: '1rem',
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(255, 107, 53, 0.2)',
        hover: {
          background: '#E85A2B',
          boxShadow: '0 6px 20px rgba(255, 107, 53, 0.3)',
          transform: 'translateY(-2px)',
        },
      },
      secondary: {
        background: '#8B9556',
        color: '#FFFFFF',
        borderRadius: '2rem',
        padding: '1rem 2rem',
        fontSize: '1rem',
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(139, 149, 86, 0.2)',
        hover: {
          background: '#6B7446',
          boxShadow: '0 6px 20px rgba(139, 149, 86, 0.3)',
          transform: 'translateY(-2px)',
        },
      },
      outline: {
        background: 'transparent',
        color: '#FF6B35',
        border: '2px solid #FF6B35',
        borderRadius: '2rem',
        padding: '0.875rem 1.875rem',
        fontSize: '1rem',
        fontWeight: 700,
        hover: {
          background: '#FF6B35',
          color: '#FFFFFF',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.2)',
        },
      },
    },

    // Cards
    card: {
      background: '#FFFFFF',
      borderRadius: '2rem',
      padding: '2rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      hover: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        transform: 'translateY(-4px)',
      },
    },

    // Inputs
    input: {
      background: '#FFFFFF',
      border: '2px solid #FFF9F0',
      borderRadius: '1rem',
      padding: '0.875rem 1.25rem',
      fontSize: '1rem',
      color: '#2C3E50',
      focus: {
        borderColor: '#FF6B35',
        boxShadow: '0 0 0 4px rgba(255, 107, 53, 0.1)',
      },
    },

    // Modal
    modal: {
      background: '#FFFFFF',
      borderRadius: '2rem',
      padding: '2rem',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      overlay: 'rgba(44, 62, 80, 0.5)',
    },
  },

  // Animations - Bouncy and Playful
  animations: {
    duration: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  // Breakpoints
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1280px',
  },
};

export default organicTheme;
