/**
 * PROFESSIONAL MINIMALIST THEME
 * Clean, Sharp, Data-Focused Design System
 */

const professionalTheme = {
  // Core Colors - Minimal Palette
  colors: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    accent: '#0066FF',      // Classic Blue - Professional & Trustworthy
    accentAlt: '#00D9A3',   // Mint Green - Clean & Modern
    danger: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
  },

  // Typography - Sans-Serif Professional
  typography: {
    fontFamily: {
      sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
      mono: "'SF Mono', Monaco, Consolas, monospace",
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
      displayMd: '2.25rem',  // 36px - Display heading
      displayLg: '3rem',     // 48px
      displayXl: '3.75rem',  // 60px
      display2xl: '4.5rem',  // 72px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.6,
      relaxed: 1.8,
    },
  },

  // Spacing - 8pt Grid System
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Borders - Sharp Corners Only
  borders: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '3px',
  },

  // Shadows - Subtle & Professional
  shadows: {
    none: 'none',
    sm: '0 0 0 1px rgba(0, 0, 0, 0.05)',
    md: '0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)',
    lg: '0 0 0 2px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    xl: '0 0 0 2px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },

  // Component Styles
  components: {
    button: {
      primary: {
        background: '#0066FF',
        color: '#FFFFFF',
        border: 'none',
        padding: '0.875rem 1.75rem',
        fontSize: '0.9375rem',
        fontWeight: 600,
        borderRadius: '0',
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      secondary: {
        background: 'transparent',
        color: '#111827',
        border: '1px solid #D1D5DB',
        padding: '0.875rem 1.75rem',
        fontSize: '0.9375rem',
        fontWeight: 600,
        borderRadius: '0',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      ghost: {
        background: 'transparent',
        color: '#6B7280',
        border: 'none',
        padding: '0.875rem 1.75rem',
        fontSize: '0.9375rem',
        fontWeight: 600,
        borderRadius: '0',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    card: {
      default: {
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '0',
        padding: '1.5rem',
        boxShadow: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      hover: {
        borderColor: '#D1D5DB',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      },
      elevated: {
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '0',
        padding: '2rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
      },
    },
    input: {
      default: {
        background: '#FFFFFF',
        border: '1px solid #D1D5DB',
        borderRadius: '0',
        padding: '0.75rem 1rem',
        fontSize: '0.9375rem',
        color: '#111827',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      focus: {
        borderColor: '#0066FF',
        boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.1)',
      },
    },
  },

  // Layout
  layout: {
    maxWidth: '1280px',
    headerHeight: '64px',
    sidebarWidth: '256px',
    contentPadding: '2rem',
  },

  // Transitions - Smooth & Professional
  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Grid System
  grid: {
    columns: 12,
    gap: '1.5rem',
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
};

export default professionalTheme;
