/**
 * DARK GLASSMORPHISM DESIGN SYSTEM
 * Professional, sophisticated, high-tech
 *
 * Used across the entire AttendanceQR application:
 * - Public pages (HomePage, LoginPage)
 * - Admin layout (AdminLayout, DashboardPage)
 */

const darkGlass = {
    // Background layers
    background: '#0a0e1a',
    backgroundLight: '#0f1425',
    backgroundTertiary: '#151b30',
    surface: 'rgba(255,255,255,0.03)',
    surfaceHover: 'rgba(255,255,255,0.06)',
    header: '#0a0e1a',

    // Glass effect
    glass: 'rgba(255,255,255,0.04)',
    glassBorder: 'rgba(255,255,255,0.08)',
    glassHover: 'rgba(255,255,255,0.07)',

    // Primary accent (electric blue)
    accent: '#3b82f6',
    accentLight: '#60a5fa',
    accentVivid: '#2563eb',
    accentGlow: 'rgba(59,130,246,0.4)',
    accentSecondary: '#06b6d4', // cyan
    accentGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',

    // Secondary accents
    violet: '#8b5cf6',
    cyan: '#06b6d4',

    // Text
    text: '#f1f5f9',
    textMuted: 'rgba(255,255,255,0.7)',
    textFaint: 'rgba(255,255,255,0.4)',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',

    // Borders
    border: 'rgba(255,255,255,0.06)',
    borderAccent: 'rgba(59,130,246,0.3)',

    // Status
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6',

    // Ant Design ConfigProvider tokens
    antd: {
        algorithm: 'dark',
        token: {
            colorPrimary: '#3b82f6',
            colorBgContainer: '#0f1425',
            colorBgElevated: '#151b30',
            colorBgLayout: '#0a0e1a',
            colorText: '#f1f5f9',
            colorTextSecondary: '#94a3b8',
            colorBorder: 'rgba(255,255,255,0.08)',
            borderRadius: 10,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
            Menu: {
                darkItemBg: 'transparent',
                darkItemSelectedBg: 'rgba(59,130,246,0.12)',
                darkItemHoverBg: 'rgba(59,130,246,0.06)',
                darkItemSelectedColor: '#60a5fa',
            },
            Table: {
                headerBg: '#0f1425',
                rowHoverBg: 'rgba(59,130,246,0.04)',
            },
            Card: {
                colorBgContainer: '#0f1425',
            },
            Modal: {
                contentBg: '#0f1425',
                headerBg: '#0f1425',
            },
        },
    },
};

// CSS variable exports
export const gradientText = {
    background: 'linear-gradient(135deg, #60a5fa, #06b6d4, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
};

export const glowEffect = {
    boxShadow: '0 0 20px rgba(59,130,246,0.15), 0 0 40px rgba(6,182,212,0.08)',
};

export const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
};

export default darkGlass;
