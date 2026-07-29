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

    function pressCtrl(key: string) {
        document.dispatchEvent(new KeyboardEvent('keydown', {key, ctrlKey: true, bubbles: true}));
    }

    function pressModifier(key: string) {
        document.dispatchEvent(new KeyboardEvent('keydown', {key, shiftKey: true, bubbles: true}));
    }

    it('should fire handler for simple key', async () => {
        const handler = vi.fn();
        registry.register({key: 'x', description: 'test', handler});

        pressKey('x');
        await flushFrames();

        expect(handler).toHaveBeenCalledOnce();
    });

    it('displays keys as registered in the help overlay, not uppercased', () => {
        registry.register({
            key: 'e',
            description: 'Toggle',
            handler: vi.fn(),
            context: 'Spinnaker',
        });
        registry.showHelp();

        const kbds = Array.from(document.querySelectorAll('kbd')).map((el) => el.textContent);
        expect(kbds).toContain('e');
        expect(kbds).not.toContain('E');
        registry.hideHelp();
    });

    it('displays a shifted letter as its capital, without the Shift prefix', () => {
        registry.register({
            key: 'G',
            modifiers: {shift: true},
            description: 'Jump',
            handler: vi.fn(),
            context: 'Spinnaker',
        });
        registry.showHelp();

        const kbds = Array.from(document.querySelectorAll('kbd')).map((el) => el.textContent);
        expect(kbds).toContain('G');
        expect(kbds).not.toContain('Shift + G');
        registry.hideHelp();
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
            expect.objectContaining({markdown: 'exo keystroke `x`\nDo the thing'}),
        );
    });

    it('omits the description line when none is given', () => {
        registry.register({key: 'x', description: '', handler: vi.fn()});

        pressKey('x');

        expect(Notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({markdown: 'exo keystroke `x`'}),
        );
    });

    it('does not toast when no binding matches', () => {
        pressKey('z');

        expect(Notifications.show).not.toHaveBeenCalled();
    });

    describe('pass-through prefix (Ctrl+V)', () => {
        it('passes the next keystroke through instead of firing the binding', async () => {
            const handler = vi.fn();
            registry.register({key: 'c', description: 'exo C', handler});

            pressCtrl('v'); // arm
            pressKey('c'); // should reach the page, not exo
            await flushFrames();

            expect(handler).not.toHaveBeenCalled();
        });

        it('does not let a lone modifier consume the arm (e.g. Shift in "?")', async () => {
            const handler = vi.fn();
            registry.register({key: 'c', description: 'exo C', handler});

            pressCtrl('v'); // arm
            pressModifier('Shift'); // lone modifier — must NOT consume the arm
            pressKey('c'); // the real key — still passes through
            await flushFrames();

            // If Shift had consumed the arm, 'c' would have fired the binding.
            expect(handler).not.toHaveBeenCalled();
        });

        it('is one-shot: only the immediately following keystroke passes through', async () => {
            const handler = vi.fn();
            registry.register({key: 'c', description: 'exo C', handler});

            pressCtrl('v');
            pressKey('c'); // passed through
            pressKey('c'); // handled normally
            await flushFrames();

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('shows a banner toast with the TTL when arming', () => {
            pressCtrl('v');

            expect(Notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    markdown: expect.stringContaining('pass'),
                    duration: 100_000,
                }),
            );
        });

        it('clears the banner toast when the key is consumed', () => {
            const dismiss = vi.fn();
            vi.mocked(Notifications.show).mockReturnValueOnce({dismiss});
            registry.register({key: 'c', description: 'exo C', handler: vi.fn()});

            pressCtrl('v'); // arm -> show returns {dismiss}
            pressKey('c'); // consume

            expect(dismiss).toHaveBeenCalled();
        });

        it('is consumed by a key typed in an input field (it already went to the page)', async () => {
            const handler = vi.fn();
            registry.register({key: 'c', description: 'exo C', handler});

            pressCtrl('v'); // arm
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true}));
            input.remove();
            pressKey('c'); // arm was consumed in the input — handled normally
            await flushFrames();

            expect(handler).toHaveBeenCalledOnce();
        });

        it('clears the banner toast when the arm is consumed inside an input field', () => {
            const dismiss = vi.fn();
            vi.mocked(Notifications.show).mockReturnValueOnce({dismiss});

            pressCtrl('v'); // arm -> show returns {dismiss}
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true}));
            input.remove();

            expect(dismiss).toHaveBeenCalled();
        });

        it('disarms when the banner toast is dismissed (e.g. TTL expiry)', async () => {
            const handler = vi.fn();
            registry.register({key: 'c', description: 'exo C', handler});

            let onDismiss: (() => void) | undefined;
            vi.mocked(Notifications.show).mockImplementationOnce((opts) => {
                onDismiss = opts.onDismiss;
                return {dismiss: vi.fn()};
            });

            pressCtrl('v'); // arm
            onDismiss?.(); // simulate the 100s TTL firing
            pressKey('c'); // should now be handled normally, not passed through
            await flushFrames();

            expect(handler).toHaveBeenCalledOnce();
        });
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
