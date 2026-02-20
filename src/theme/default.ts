// Semantic color tokens for the extension

export const theme = {
    // --- Text ---
    text: {
        primary: '#1a1a1a',
        secondary: '#666',
        tertiary: '#888',
        muted: '#999',
        dark: '#333',
        white: '#fff',
        whiteTranslucent: 'rgba(255, 255, 255, 0.7)',
        link: '#2563eb',
    },

    // --- Backgrounds ---
    bg: {
        page: '#000',
        card: '#646464',
        cardSubtle: '#848484',
        white: 'white',
    },

    // --- Borders ---
    border: {
        light: '#ccc',
        subtle: '#f0f0f4',
        separator: '#f0f0f0',
        medium: '#d0d0d0',
        card: '#525252',
    },

    // --- Shadows ---
    shadow: {
        xs: '0 1px 2px rgba(0,0,0,0.04)',
        sm: '0 2px 8px rgba(0,0,0,0.2)',
        overlay: '0 4px 24px rgba(0, 0, 0, 0.3)',
    },

    // --- Status colors ---
    status: {
        success: '#22c55e',
        successDark: '#4CAF50',
        successDarkBorder: '#45a049',
        error: '#ef4444',
        errorDark: '#f44336',
        errorDarkBorder: '#da190b',
    },

    // --- Notification toast ---
    toast: {
        successBg: 'rgba(34, 197, 94, 0.9)',
        errorBg: 'rgba(239, 68, 68, 0.9)',
        defaultBg: 'rgba(0, 0, 0, 0.8)',
        detailBg: 'rgba(0, 0, 0, 0.3)',
        closeBtnDefault: 'rgba(255, 255, 255, 0.4)',
        closeBtnHover: 'rgba(255, 255, 255, 1)',
    },

    // --- Rich link ---
    richlink: {
        specializedBg: 'rgba(22, 163, 74, 0.8)',
        fallbackBg: 'rgba(22, 163, 74, 0.5)',
        specializedHoverBg: 'rgba(34, 197, 94, 0.9)',
        fallbackHoverBg: 'rgba(22, 163, 74, 0.7)',
        border: 'rgba(34, 197, 94, 0.3)',
    },

    // --- Overlays ---
    overlay: {
        dark: 'rgba(0, 0, 0, 0.85)',
    },

    // --- Misc ---
    flashBorder: '#ffffff',
} as const;
