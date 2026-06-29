import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {KeybindingRegistry} from '@exo/lib/keybindings';
import {Notifications} from '@exo/lib/toast-notification';

vi.mock('@exo/lib/toast-notification', () => ({
    Notifications: {show: vi.fn()},
    NotificationType: {Success: 'success', Error: 'error', Default: 'default'},
}));

// Fired handlers are deferred past the next paint (so the toast renders first).
// Flush two animation frames to let a deferred handler run.
const flushFrames = () =>
    new Promise<void>((resolve) =>
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())),
    );

describe('KeybindingRegistry', () => {
    let registry: KeybindingRegistry;

    beforeEach(() => {
        vi.clearAllMocks();
        registry = new KeybindingRegistry();
        registry.listen();
    });

    afterEach(() => {
        registry.unlisten();
    });

    function pressKey(key: string, opts: {shiftKey?: boolean} = {}) {
        document.dispatchEvent(
            new KeyboardEvent('keydown', {
                key,
                shiftKey: opts.shiftKey ?? false,
                bubbles: true,
            }),
        );
    }

    it('should fire handler for simple key', async () => {
        const handler = vi.fn();
        registry.register({key: 'x', description: 'test', handler});

        pressKey('x');
        await flushFrames();

        expect(handler).toHaveBeenCalledOnce();
    });

    it('should fire handler for ? key (requires shift)', async () => {
        const handler = vi.fn();
        registry.register({key: '?', description: 'test', handler});

        // Pressing ? on a keyboard sends shiftKey: true, key: '?'
        pressKey('?', {shiftKey: true});
        await flushFrames();

        expect(handler).toHaveBeenCalledOnce();
    });

    it('should NOT fire lowercase key handler when shift is held', async () => {
        const handler = vi.fn();
        registry.register({key: 'x', description: 'test', handler});

        // Shift+X sends key: 'X', shiftKey: true
        pressKey('X', {shiftKey: true});
        await flushFrames();

        expect(handler).not.toHaveBeenCalled();
    });

    it('should fire handler for explicit shift+letter binding', async () => {
        const handler = vi.fn();
        registry.register({
            key: 'x',
            description: 'test',
            handler,
            modifiers: {shift: true},
        });

        pressKey('X', {shiftKey: true});
        await flushFrames();

        expect(handler).toHaveBeenCalledOnce();
    });

    it('should not fire when typing in an input field', async () => {
        const handler = vi.fn();
        registry.register({key: 'x', description: 'test', handler});

        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'x', bubbles: true}));
        await flushFrames();

        expect(handler).not.toHaveBeenCalled();
        input.remove();
    });

    it('shows an "exo keystroke" toast with the binding description', () => {
        registry.register({key: 'x', description: 'Do the thing', handler: vi.fn()});

        pressKey('x');

        // Toast fires synchronously, before the handler is deferred. The
        // keystroke is a markdown `code` span; the description is on its own line.
        expect(Notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({markdown: 'exo keystroke `X`\nDo the thing'}),
        );
    });

    it('omits the description line when none is given', () => {
        registry.register({key: 'x', description: '', handler: vi.fn()});

        pressKey('x');

        expect(Notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({markdown: 'exo keystroke `X`'}),
        );
    });

    it('does not toast when no binding matches', () => {
        pressKey('z');

        expect(Notifications.show).not.toHaveBeenCalled();
    });

    it('should show help overlay on ?', async () => {
        // ? help is auto-registered in constructor
        pressKey('?', {shiftKey: true});
        await flushFrames();

        const overlay = document.querySelector('[style*="position: fixed"]');
        expect(overlay).not.toBeNull();

        // Clean up
        registry.hideHelp();
    });
});
