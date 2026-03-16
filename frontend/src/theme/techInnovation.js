/**
 * Tech Innovation Theme
 * Consistent theme for the entire application
 */

// Color Palette
export const colors = {
    // Primary Colors
    background: '#1e1e1e',      // Dark Gray
    backgroundLight: '#2a2a2a', // Lighter Gray
    header: '#121212',          // Darker Gray
    surface: '#252525',         // Card surfaces

    // Accent Colors
    accent: '#0066ff',          // Electric Blue
    accentSecondary: '#00ffff', // Neon Cyan
    accentGradient: 'linear-gradient(135deg, #0066ff, #00ffff)',

    // Text Colors
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.7)',
    textFaint: 'rgba(255, 255, 255, 0.4)',

    // Status Colors
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff4444',
    info: '#00aaff',
};

// CSS Variables to inject into :root
export const cssVariables = `
  :root {
    --bg-primary: ${colors.background};
    --bg-secondary: ${colors.backgroundLight};
    --bg-header: ${colors.header};
    --bg-surface: ${colors.surface};
    --accent: ${colors.accent};
    --accent-secondary: ${colors.accentSecondary};
    --accent-gradient: ${colors.accentGradient};
    --text-primary: ${colors.text};
    --text-muted: ${colors.textMuted};
    --text-faint: ${colors.textFaint};
    --success: ${colors.success};
    --warning: ${colors.warning};
    --error: ${colors.error};
    --info: ${colors.info};
  }
`;

// Common style objects for reuse
export const gradientText = {
    background: colors.accentGradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
};

export const glowEffect = {
    boxShadow: `0 0 20px ${colors.accent}44, 0 0 40px ${colors.accentSecondary}22`,
};

export const cardStyle = {
    background: colors.surface,
    border: `1px solid ${colors.accent}22`,
    borderRadius: '16px',
};

export default colors;
