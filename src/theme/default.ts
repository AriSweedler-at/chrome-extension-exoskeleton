// Semantic color tokens for the extension

export const theme = {
    // --- Text ---
    text: {
        primary: 'hsla(0, 0%, 10%, 1)',
        secondary: 'hsla(0, 0%, 40%, 1)',
        tertiary: 'hsla(0, 0%, 53%, 1)',
        muted: 'hsla(0, 0%, 60%, 1)',
        dark: 'hsla(0, 0%, 20%, 1)',
        white: 'hsla(0, 0%, 100%, 1)',
        whiteTranslucent: 'hsla(0, 0%, 100%, 0.7)',
        link: 'hsla(221, 83%, 53%, 1)',
    },

    // --- Backgrounds ---
    bg: {
        page: 'hsla(0, 0%, 0%, 1)',
        card: 'hsla(0, 0%, 39%, 1)',
        cardSubtle: 'hsla(0, 0%, 52%, 1)',
        white: 'hsla(0, 0%, 100%, 1)',
    },

    // --- Borders ---
    border: {
        light: 'hsla(0, 0%, 80%, 1)',
        subtle: 'hsla(240, 15%, 95%, 1)',
        separator: 'hsla(0, 0%, 94%, 1)',
        medium: 'hsla(0, 0%, 82%, 1)',
        card: 'hsla(0, 0%, 32%, 1)',
    },

    // --- Shadows ---
    shadow: {
        xs: '0 1px 2px hsla(0, 0%, 0%, 0.04)',
        sm: '0 2px 8px hsla(0, 0%, 0%, 0.2)',
        overlay: '0 4px 24px hsla(0, 0%, 0%, 0.3)',
    },

    // --- Status colors ---
    status: {
        success: 'hsla(142, 71%, 45%, 1)',
        successDark: 'hsla(122, 39%, 49%, 1)',
        successDarkBorder: 'hsla(123, 40%, 45%, 1)',
        error: 'hsla(0, 84%, 60%, 1)',
        errorDark: 'hsla(4, 90%, 58%, 1)',
        errorDarkBorder: 'hsla(4, 90%, 45%, 1)',
    },

    // --- Notification toast ---
    toast: {
        successBg: 'hsla(142, 71%, 45%, 0.9)',
        errorBg: 'hsla(0, 84%, 60%, 0.9)',
        defaultBg: 'hsla(0, 0%, 0%, 0.8)',
        detailBg: 'hsla(0, 0%, 0%, 0.3)',
        closeBtnDefault: 'hsla(0, 0%, 100%, 0.4)',
        closeBtnHover: 'hsla(0, 0%, 100%, 1)',
        padding: '12px 16px',
        marginBottom: '8px',
        borderRadius: '4px',
        fontSize: '14px',
        lineHeight: '1.4',
        fadeMs: 300,
        detailFontSize: '11px',
        detailPadding: '8px',
        detailBorderRadius: '3px',
        detailFontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
        previewFontSize: '11px',
        previewOpacity: '0.7',
        closeBtnFontSize: '16px',
        containerTop: '16px',
        containerRight: '16px',
        containerZIndex: 10000,
        containerMinWidth: '200px',
    },

    // --- Rich link ---
    richlink: {
        specializedBg: 'hsla(142, 76%, 36%, 0.8)',
        fallbackBg: 'hsla(142, 76%, 36%, 0.5)',
        specializedHoverBg: 'hsla(142, 71%, 45%, 0.9)',
        fallbackHoverBg: 'hsla(142, 76%, 36%, 0.7)',
        border: 'hsla(142, 71%, 45%, 0.3)',
    },

    // --- Overlays ---
    overlay: {
        dark: 'hsla(0, 0%, 0%, 0.85)',
    },

    // --- Misc ---
    flashBorder: 'hsla(0, 0%, 100%, 1)',
} as const;
