// Semantic color tokens for the extension.
// The standalone libraries (lib/toast-notification, lib/keybindings) carry
// their own palettes — this file styles only app code.

export const theme = {
    // --- Text ---
    text: {
        secondary: 'hsla(0, 0%, 40%, 1)',
        white: 'hsla(0, 0%, 100%, 1)',
    },

    // --- Backgrounds ---
    bg: {
        cardSubtle: 'hsla(0, 0%, 52%, 1)',
    },

    // --- Borders ---
    border: {
        light: 'hsla(0, 0%, 80%, 1)',
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

    // --- App content rendered INSIDE toasts ---
    // The toast library styles its own chrome (see lib/toast-notification/theme.ts);
    // these style the app's custom toast bodies. Sizes are em-relative to the toast.
    toast: {
        detail: {
            background: 'hsla(0, 0%, 0%, 0.3)',
            fontSize: '0.9em',
            padding: '8px',
            borderRadius: '3px',
            fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
        },
        preview: {
            fontSize: '0.8em',
            opacity: '0.7',
        },
        // Format-label chip inside the "Next: A → B" cycle preview
        previewChip: {
            background: 'hsla(0, 0%, 100%, 0.18)',
            padding: '1px 6px',
            borderRadius: '3px',
            fontWeight: '600',
        },
    },

    // --- Environment-switch buttons (popup) ---
    envButton: {
        specializedBg: 'hsla(142, 76%, 36%, 0.8)',
        fallbackBg: 'hsla(142, 76%, 36%, 0.5)',
        specializedHoverBg: 'hsla(142, 71%, 45%, 0.9)',
        border: 'hsla(142, 71%, 45%, 0.3)',
    },

    // --- Misc ---
    flashBorder: 'hsla(0, 0%, 100%, 1)',
} as const;
