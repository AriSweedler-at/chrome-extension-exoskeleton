import {Notifications, type ToastHandle} from '@exo/lib/toast-notification';
import {code} from '@exo/lib/toast-notification/markdown';
import {theme} from '@exo/theme/default';

/**
 * Keybinding Registry Library
 *
 * Provides a data-driven keybinding system with auto-generated help overlay.
 * Features:
 * - Register keybindings as objects with key, description, and handler
 * - Automatic event listener setup
 * - Automatic "exo keystroke" toast on every fired binding
 * - Auto-generated help overlay with '?' key
 * - Context-aware filtering (skips INPUT/TEXTAREA elements)
 */

const INPUT_TAG_NAMES = ['INPUT', 'TEXTAREA'] as const;

function isTypingInInputField(target: HTMLElement): boolean {
    return INPUT_TAG_NAMES.some((tag) => target.tagName === tag) || target.isContentEditable;
}

/**
 * Run a callback after the next paint. Lets the keystroke toast render before a
 * handler that navigates away tears down the page. Falls back to setTimeout
 * where requestAnimationFrame is unavailable.
 */
function afterNextPaint(fn: () => void): void {
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => window.requestAnimationFrame(fn));
    } else {
        setTimeout(fn, 0);
    }
}

export interface Keybinding {
    key: string;
    description: string;
    handler: () => void;
    modifiers?: {
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
        meta?: boolean;
    };
    context?: string; // Optional grouping context (e.g., "GitHub", "Spinnaker")
}

// The "quote next keystroke" prefix: after it, the next key is passed straight
// to the page instead of being handled by exo. Outside input fields (where we
// don't listen anyway), Ctrl+V has no native effect, so it's free to reuse.
const PASS_THROUGH_PREFIX = 'ctrl+v';

// How long the armed pass-through waits for its key before auto-disarming.
const PASS_THROUGH_TTL_MS = 100_000;

// Lone modifier keydowns (e.g. the Shift in '?' = Shift+Slash). They must not
// consume the one-shot pass-through — we wait for the actual key.
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph']);

// Derive the {key, modifiers} a keydown maps to — shared by lookup and display.
// For non-letter keys (like ? ! @ #) shift is implicit in the character itself,
// so only treat shift as an explicit modifier for letters (a-z).
function eventBindingParts(event: KeyboardEvent): Pick<Keybinding, 'key' | 'modifiers'> {
    const isLetter = /^[a-zA-Z]$/.test(event.key);
    return {
        key: event.key,
        modifiers: {
            ctrl: event.ctrlKey,
            shift: isLetter && event.shiftKey,
            alt: event.altKey,
            meta: event.metaKey,
        },
    };
}

export class KeybindingRegistry {
    private keybindings: Map<string, Keybinding> = new Map();
    private helpOverlay: HTMLElement | null = null;
    private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
    private passThrough = false; // armed by PASS_THROUGH_PREFIX, consumed by next key
    private passThroughToast: ToastHandle | null = null;
    private helpCloseHandler: ((event?: Event) => void) | null = null;

    constructor() {
        // Auto-register the help keybinding
        this.register({
            key: '?',
            description: 'Show this help overlay',
            handler: () => this.showHelp(),
            context: 'Global',
        });
    }

    /**
     * Register a keybinding
     */
    register(keybinding: Keybinding): void {
        const key = this.getKeySignature(keybinding);
        this.keybindings.set(key, keybinding);
    }

    /**
     * Register multiple keybindings at once
     */
    registerAll(keybindings: Keybinding[]): void {
        keybindings.forEach((kb) => this.register(kb));
    }

    /**
     * Unregister a keybinding
     */
    unregister(key: string, modifiers?: Keybinding['modifiers']): void {
        const signature = this.getKeySignature({key, modifiers} as Keybinding);
        this.keybindings.delete(signature);
    }

    /**
     * Start listening for keybindings
     */
    listen(): void {
        if (this.keydownHandler) {
            return; // Already listening
        }

        this.keydownHandler = (event: KeyboardEvent) => {
            // Skip if user is typing in an input field
            if (isTypingInInputField(event.target as HTMLElement)) {
                return;
            }

            const parts = eventBindingParts(event);
            const signature = this.getKeySignature(parts);

            // A prior prefix armed this keystroke: let it reach the page
            // untouched (no preventDefault/stop), consuming the one-shot arm.
            if (this.passThrough) {
                // A lone modifier (e.g. the Shift in '?') passes through but
                // must not consume the arm — wait for the actual key.
                if (MODIFIER_KEYS.has(event.key)) {
                    return;
                }
                const passed = this.formatKeybinding(parts);
                this.disarmPassThrough();
                this.notify(`passed ${code(passed)} to the page`);
                return;
            }

            // The prefix itself: arm the next keystroke to pass through, and show
            // a banner toast that stays until consumed or the TTL expires (which
            // also disarms, via onDismiss).
            if (signature === PASS_THROUGH_PREFIX) {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.passThrough = true;
                this.passThroughToast = this.notify(
                    '**pass-through** — next key goes to the page',
                    {duration: PASS_THROUGH_TTL_MS, onDismiss: () => this.disarmPassThrough()},
                );
                return;
            }

            const keybinding = this.keybindings.get(signature);
            if (keybinding) {
                // Capture phase + stopImmediatePropagation so our shortcut wins
                // over the host page's own handlers (e.g. GitHub's 'c' hotkey).
                event.preventDefault();
                event.stopImmediatePropagation();
                this.announce(keybinding);
                // Defer the handler past the next paint so the toast is visible
                // even when the handler navigates to another page.
                afterNextPaint(keybinding.handler);
            }
        };

        // Capture phase: intercept before the page's bubble-phase listeners.
        document.addEventListener('keydown', this.keydownHandler, true);
    }

    /**
     * Stop listening for keybindings
     */
    unlisten(): void {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler, true);
            this.keydownHandler = null;
        }
        this.disarmPassThrough();
    }

    /**
     * Generate a unique signature for a keybinding
     */
    private getKeySignature(keybinding: Pick<Keybinding, 'key' | 'modifiers'>): string {
        const modifiers = keybinding.modifiers || {};
        const parts: string[] = [];

        if (modifiers.ctrl) parts.push('ctrl');
        if (modifiers.shift) parts.push('shift');
        if (modifiers.alt) parts.push('alt');
        if (modifiers.meta) parts.push('meta');
        parts.push(keybinding.key.toLowerCase());

        return parts.join('+');
    }

    /**
     * Show a toast. Best-effort: a rendering failure must never block the
     * keystroke that triggered it.
     */
    private notify(
        markdown: string,
        opts: {duration?: number; onDismiss?: () => void} = {},
    ): ToastHandle | null {
        try {
            return Notifications.show({markdown, ...opts});
        } catch (err) {
            console.error('[exo keybindings] failed to show toast', err);
            return null;
        }
    }

    /** Disarm pass-through and clear its banner toast (idempotent). */
    private disarmPassThrough(): void {
        this.passThrough = false;
        const toast = this.passThroughToast;
        this.passThroughToast = null;
        toast?.dismiss();
    }

    /**
     * Show the "exo keystroke" toast for a fired binding. The keystroke is
     * rendered as an inline code chip so it reads as an interpolated value, not
     * part of the static template; the description follows when provided.
     */
    private announce(keybinding: Keybinding): void {
        const lines = [`exo keystroke ${code(this.formatKeybinding(keybinding))}`];
        if (keybinding.description) {
            lines.push(keybinding.description);
        }

        this.notify(lines.join('\n'));
    }

    /**
     * Format a keybinding for display
     */
    private formatKeybinding(keybinding: Pick<Keybinding, 'key' | 'modifiers'>): string {
        const modifiers = keybinding.modifiers || {};
        const parts: string[] = [];

        if (modifiers.ctrl) parts.push('Ctrl');
        if (modifiers.shift) parts.push('Shift');
        if (modifiers.alt) parts.push('Alt');
        if (modifiers.meta) parts.push('⌘');
        parts.push(keybinding.key.toUpperCase());

        return parts.join(' + ');
    }

    /**
     * Show the help overlay
     */
    showHelp(): void {
        if (this.helpOverlay) {
            return; // Already showing
        }

        // Group keybindings by context
        const grouped = new Map<string, Keybinding[]>();
        this.keybindings.forEach((kb) => {
            const context = kb.context || 'Other';
            if (!grouped.has(context)) {
                grouped.set(context, []);
            }
            grouped.get(context)!.push(kb);
        });

        // Create overlay
        this.helpOverlay = document.createElement('div');
        this.helpOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${theme.overlay.dark};
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

        // Create content container
        const content = document.createElement('div');
        content.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: ${theme.shadow.overlay};
    `;

        // Add title
        const title = document.createElement('h2');
        title.textContent = 'Keyboard Shortcuts';
        title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
      color: ${theme.text.primary};
    `;
        content.appendChild(title);

        // Add keybindings grouped by context
        grouped.forEach((keybindings, context) => {
            // Add context header
            const contextHeader = document.createElement('h3');
            contextHeader.textContent = context;
            contextHeader.style.cssText = `
        margin: 16px 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: ${theme.text.secondary};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
            content.appendChild(contextHeader);

            // Add keybindings for this context
            keybindings.forEach((kb) => {
                const row = document.createElement('div');
                row.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid ${theme.border.separator};
        `;

                const desc = document.createElement('span');
                desc.textContent = kb.description;
                desc.style.cssText = `
          flex: 1;
          color: ${theme.text.dark};
          font-size: 14px;
        `;

                const keyDisplay = document.createElement('kbd');
                keyDisplay.textContent = this.formatKeybinding(kb);
                keyDisplay.style.cssText = `
          background: ${theme.bg.cardSubtle};
          border: 1px solid ${theme.border.medium};
          border-radius: 4px;
          padding: 4px 8px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          color: ${theme.text.dark};
          white-space: nowrap;
          margin-left: 16px;
        `;

                row.appendChild(desc);
                row.appendChild(keyDisplay);
                content.appendChild(row);
            });
        });

        // Add close instruction
        const closeHint = document.createElement('p');
        closeHint.textContent = 'Press ESC or click anywhere to close';
        closeHint.style.cssText = `
      margin: 20px 0 0 0;
      text-align: center;
      color: ${theme.text.muted};
      font-size: 12px;
    `;
        content.appendChild(closeHint);

        this.helpOverlay.appendChild(content);
        document.body.appendChild(this.helpOverlay);

        // Close on click or ESC
        const closeHandler = (event?: Event) => {
            if (event instanceof KeyboardEvent && event.key !== 'Escape') {
                return;
            }
            this.hideHelp();
        };

        this.helpOverlay.addEventListener('click', closeHandler);
        document.addEventListener('keydown', closeHandler);

        // Store cleanup handler
        this.helpCloseHandler = closeHandler;
    }

    /**
     * Hide the help overlay
     */
    hideHelp(): void {
        if (!this.helpOverlay) {
            return;
        }

        if (this.helpCloseHandler) {
            document.removeEventListener('keydown', this.helpCloseHandler);
            this.helpCloseHandler = null;
        }

        this.helpOverlay.remove();
        this.helpOverlay = null;
    }

    /**
     * Get all registered keybindings
     */
    getAll(): Keybinding[] {
        return Array.from(this.keybindings.values());
    }

    /**
     * Clear all keybindings (except help)
     */
    clear(): void {
        const helpKey = this.getKeySignature({key: '?', modifiers: {}} as Keybinding);
        const helpBinding = this.keybindings.get(helpKey);
        this.keybindings.clear();
        if (helpBinding) {
            this.keybindings.set(helpKey, helpBinding);
        }
    }
}

// Export a singleton instance
export const keybindings = new KeybindingRegistry();
