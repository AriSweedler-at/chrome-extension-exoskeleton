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
    // Exactly one of key/sequence. A sequence step is written like a
    // signature: a plain key ('g') or modifier-prefixed ('shift+g'). Escape
    // is reserved (it closes the help overlay) and cannot be a step.
    key?: string;
    sequence?: string[];
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

// How long a pending sequence waits for its next keystroke.
export const SEQUENCE_TTL_MS = 1_200;

// Joins the per-keystroke signatures of a sequence. A single-key signature
// never contains a space (the Space key itself is not bindable this way).
const SEQUENCE_SEPARATOR = ' ';

// Parse a sequence step ('g', 'shift+g', 'ctrl+x') into binding parts.
function parseStep(step: string): {key: string; modifiers: Keybinding['modifiers']} {
    const tokens = step.split('+');
    const key = tokens.pop() || '+';
    const modifiers: Keybinding['modifiers'] = {};
    for (const token of tokens) {
        const name = token.toLowerCase();
        if (name === 'ctrl') modifiers.ctrl = true;
        if (name === 'shift') modifiers.shift = true;
        if (name === 'alt') modifiers.alt = true;
        if (name === 'meta') modifiers.meta = true;
    }
    return {key, modifiers};
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
    // Every proper prefix of a registered sequence, as a joined signature.
    private sequencePrefixes: Set<string> = new Set();
    private pendingSteps: string[] = []; // signatures typed toward a sequence
    private pendingTimer: number | null = null;
    private pendingToast: ToastHandle | null = null;

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
        if (!keybinding.sequence?.length && !keybinding.key) {
            console.error('[exo keybindings] a binding needs a key or a sequence', keybinding);
            return;
        }
        if (keybinding.sequence?.some((step) => parseStep(step).key.toLowerCase() === 'escape')) {
            console.error('[exo keybindings] Escape cannot be a sequence step', keybinding);
            return;
        }
        this.keybindings.set(this.bindingSignature(keybinding), keybinding);
        this.reindexSequences();
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
        this.reindexSequences();
    }

    unregisterSequence(sequence: string[]): void {
        this.keybindings.delete(this.bindingSignature({sequence} as Keybinding));
        this.reindexSequences();
    }

    /**
     * Start listening for keybindings
     */
    listen(): void {
        if (this.keydownHandler) {
            return; // Already listening
        }

        this.keydownHandler = (event: KeyboardEvent) => {
            const parts = eventBindingParts(event);
            const signature = this.getKeySignature(parts);

            // A prior prefix armed this keystroke: let it reach the page
            // untouched (no preventDefault/stop), consuming the one-shot arm.
            // Checked before the input-field skip — a key typed into an input
            // has already gone to the page, so it consumes the arm too.
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

            // Skip if user is typing in an input field. The key went to the
            // field, so it also breaks any pending sequence.
            if (isTypingInInputField(event.target as HTMLElement)) {
                this.resetPendingSequence();
                return;
            }

            // The prefix itself: arm the next keystroke to pass through, and show
            // a banner toast that stays until consumed or the TTL expires (which
            // also disarms, via onDismiss). Pass-through and a pending sequence
            // are mutually exclusive modes.
            if (signature === PASS_THROUGH_PREFIX) {
                this.resetPendingSequence();
                event.preventDefault();
                event.stopImmediatePropagation();
                this.passThrough = true;
                this.passThroughToast = this.notify(
                    '**pass-through** — next key goes to the page',
                    {duration: PASS_THROUGH_TTL_MS, onDismiss: () => this.disarmPassThrough()},
                );
                return;
            }

            // Continue a pending sequence: fire on an exact match, extend on a
            // prefix, otherwise abandon it and treat this keystroke as fresh.
            if (this.pendingSteps.length > 0) {
                if (MODIFIER_KEYS.has(event.key)) {
                    return;
                }
                const candidate = [...this.pendingSteps, signature];
                const candidateSignature = candidate.join(SEQUENCE_SEPARATOR);
                const sequenceBinding = this.keybindings.get(candidateSignature);
                if (sequenceBinding) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this.resetPendingSequence();
                    this.announce(sequenceBinding);
                    afterNextPaint(sequenceBinding.handler);
                    return;
                }
                if (this.sequencePrefixes.has(candidateSignature)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this.setPendingSequence(candidate);
                    return;
                }
                this.resetPendingSequence();
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
                return;
            }

            // Start a sequence. Checked after the single-binding lookup, so a
            // single binding always wins over a same-key sequence prefix.
            if (this.sequencePrefixes.has(signature)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.setPendingSequence([signature]);
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
        this.resetPendingSequence();
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
        parts.push((keybinding.key ?? '').toLowerCase());

        return parts.join('+');
    }

    private bindingSignature(keybinding: Keybinding): string {
        if (keybinding.sequence?.length) {
            return keybinding.sequence
                .map((step) => this.getKeySignature(parseStep(step)))
                .join(SEQUENCE_SEPARATOR);
        }
        return this.getKeySignature(keybinding);
    }

    // A single binding is matched before a sequence can start, so a sequence
    // whose first step collides with a single binding is unreachable.
    private reindexSequences(): void {
        this.sequencePrefixes.clear();
        for (const [signature, keybinding] of this.keybindings) {
            if (!keybinding.sequence?.length) continue;
            const steps = signature.split(SEQUENCE_SEPARATOR);
            for (let i = 1; i < steps.length; i++) {
                this.sequencePrefixes.add(steps.slice(0, i).join(SEQUENCE_SEPARATOR));
            }
        }
        for (const prefix of this.sequencePrefixes) {
            if (!prefix.includes(SEQUENCE_SEPARATOR) && this.keybindings.has(prefix)) {
                console.warn(
                    `[exo keybindings] single binding '${prefix}' shadows a sequence starting with it`,
                );
            }
        }
    }

    private setPendingSequence(steps: string[]): void {
        this.resetPendingSequence();
        this.pendingSteps = steps;
        this.pendingTimer = window.setTimeout(() => this.resetPendingSequence(), SEQUENCE_TTL_MS);
        // The toast mirrors the TTL but the timer above is authoritative —
        // hovering a toast pauses its countdown animation.
        this.pendingToast = this.notify(
            `**pending** ${code(this.formatSequenceSignatures(steps))} — waiting for the next key`,
            {duration: SEQUENCE_TTL_MS, onDismiss: () => this.resetPendingSequence()},
        );
    }

    /** Abort any pending sequence, its timer, and its banner (idempotent). */
    private resetPendingSequence(): void {
        this.pendingSteps = [];
        const timer = this.pendingTimer;
        this.pendingTimer = null;
        if (timer !== null) window.clearTimeout(timer);
        const toast = this.pendingToast;
        this.pendingToast = null;
        toast?.dismiss();
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
    private formatKeybinding(
        keybinding: Pick<Keybinding, 'key' | 'modifiers' | 'sequence'>,
    ): string {
        if (keybinding.sequence?.length) {
            return this.formatSequenceSignatures(
                keybinding.sequence.map((step) => this.getKeySignature(parseStep(step))),
            );
        }

        const key = keybinding.key ?? '';
        const modifiers = keybinding.modifiers || {};
        // A shifted letter reads as its capital ('G'), not 'Shift + g'.
        const isShiftedLetter = Boolean(modifiers.shift) && /^[a-zA-Z]$/.test(key);
        const parts: string[] = [];

        if (modifiers.ctrl) parts.push('Ctrl');
        if (modifiers.shift && !isShiftedLetter) parts.push('Shift');
        if (modifiers.alt) parts.push('Alt');
        if (modifiers.meta) parts.push('⌘');
        parts.push(isShiftedLetter ? key.toUpperCase() : key);

        return parts.join(' + ');
    }

    // 'g g' renders as 'gg'; steps that need more than one character keep a
    // space between them ('Ctrl + V g').
    private formatSequenceSignatures(stepSignatures: string[]): string {
        const parts = stepSignatures.map((signature) =>
            this.formatKeybinding(parseStep(signature)),
        );
        return parts.every((part) => part.length === 1) ? parts.join('') : parts.join(' ');
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
        this.resetPendingSequence();
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
        this.reindexSequences();
        this.resetPendingSequence();
        this.disarmPassThrough();
    }
}

// Export a singleton instance
export const keybindings = new KeybindingRegistry();
