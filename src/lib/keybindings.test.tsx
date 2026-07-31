import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {KeybindingRegistry, SEQUENCE_TTL_MS} from '@exo/lib/keybindings';
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

    describe('multi-keystroke sequences', () => {
        beforeEach(() => {
            // Keep requestAnimationFrame real so flushFrames() still works;
            // only the sequence TTL runs on fake time.
            vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']});
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        function registerSequence(handler = vi.fn(), sequence = ['g', 'g']) {
            registry.register({sequence, description: 'Sequence demo', handler});
            return handler;
        }

        it('fires the handler after the full sequence', async () => {
            const handler = registerSequence();

            pressKey('g');
            expect(handler).not.toHaveBeenCalled();
            pressKey('g');
            await flushFrames();

            expect(handler).toHaveBeenCalledOnce();
        });

        it('swallows the prefix keystroke (preventDefault)', () => {
            registerSequence();

            const event = new KeyboardEvent('keydown', {key: 'g', bubbles: true, cancelable: true});
            document.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
        });

        it('does not swallow a key that is neither a binding nor a prefix', () => {
            registerSequence();

            const event = new KeyboardEvent('keydown', {key: 'z', bubbles: true, cancelable: true});
            document.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(false);
            expect(Notifications.show).not.toHaveBeenCalled();
        });

        it('shows a pending banner naming the prefix, on the sequence TTL', () => {
            registerSequence();

            pressKey('g');

            expect(Notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    markdown: expect.stringContaining('`g`'),
                    duration: SEQUENCE_TTL_MS,
                }),
            );
        });

        it('dismisses the pending banner when the sequence completes', () => {
            const dismiss = vi.fn();
            vi.mocked(Notifications.show).mockReturnValueOnce({dismiss} as never);
            registerSequence();

            pressKey('g');
            pressKey('g');

            expect(dismiss).toHaveBeenCalled();
        });

        it('announces the completed sequence as a single chip', () => {
            registerSequence();

            pressKey('g');
            pressKey('g');

            expect(Notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({markdown: 'exo keystroke `gg`\nSequence demo'}),
            );
        });

        it('resets after the TTL, so a late second key does not fire', async () => {
            const handler = registerSequence();

            pressKey('g');
            vi.advanceTimersByTime(SEQUENCE_TTL_MS + 1);
            pressKey('g'); // starts a fresh pending sequence instead
            await flushFrames();

            expect(handler).not.toHaveBeenCalled();
            // Two pending banners were shown, one per prefix press.
            const pendingCalls = vi
                .mocked(Notifications.show)
                .mock.calls.filter(([opts]) => String(opts.markdown).includes('pending'));
            expect(pendingCalls).toHaveLength(2);
        });

        it('restarts the TTL on every step of a longer sequence', async () => {
            const handler = vi.fn();
            registry.register({sequence: ['g', 'i', 'g'], description: 'three', handler});

            pressKey('g');
            vi.advanceTimersByTime(SEQUENCE_TTL_MS - 100);
            pressKey('i');
            vi.advanceTimersByTime(SEQUENCE_TTL_MS - 100);
            pressKey('g');
            await flushFrames();

            expect(handler).toHaveBeenCalledOnce();
        });

        it('aborts when the pending banner is dismissed (click)', async () => {
            const handler = registerSequence();
            let onDismiss: (() => void) | undefined;
            vi.mocked(Notifications.show).mockImplementationOnce((opts) => {
                onDismiss = opts.onDismiss;
                return {dismiss: vi.fn()} as never;
            });

            pressKey('g');
            onDismiss?.();
            pressKey('g');
            await flushFrames();

            expect(handler).not.toHaveBeenCalled();
        });

        it('processes the aborting key normally when a prefix is abandoned', async () => {
            const sequenceHandler = registerSequence();
            const singleHandler = vi.fn();
            registry.register({key: 'f', description: 'single f', handler: singleHandler});

            pressKey('g');
            pressKey('f');
            await flushFrames();

            expect(sequenceHandler).not.toHaveBeenCalled();
            expect(singleHandler).toHaveBeenCalledOnce();
            expect(Notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({markdown: 'exo keystroke `f`\nsingle f'}),
            );
        });

        it('ignores a lone modifier mid-sequence', async () => {
            const handler = registerSequence();

            pressKey('g');
            pressModifier('Shift');
            pressKey('g');
            await flushFrames();

            expect(handler).toHaveBeenCalledOnce();
        });

        it('matches a shifted step only on a real shifted keydown', async () => {
            const shifted = vi.fn();
            registry.register({sequence: ['g', 'shift+g'], description: 'gG', handler: shifted});
            const plain = registerSequence();

            pressKey('g');
            pressKey('G', {shiftKey: true});
            await flushFrames();

            expect(shifted).toHaveBeenCalledOnce();
            expect(plain).not.toHaveBeenCalled();
        });

        it('leaves single bindings untouched by a registered sequence', async () => {
            registerSequence();
            const handler = vi.fn();
            registry.register({key: 'x', description: 'single', handler});

            pressKey('x');
            await flushFrames();

            expect(handler).toHaveBeenCalledOnce();
            expect(Notifications.show).not.toHaveBeenCalledWith(
                expect.objectContaining({markdown: expect.stringContaining('pending')}),
            );
        });

        it('lets a single binding shadow a sequence with the same first key', async () => {
            const sequenceHandler = registerSequence();
            const singleHandler = vi.fn();
            registry.register({key: 'g', description: 'single g', handler: singleHandler});

            pressKey('g');
            await flushFrames();

            expect(singleHandler).toHaveBeenCalledOnce();
            expect(sequenceHandler).not.toHaveBeenCalled();
        });

        it('cancels a pending sequence when typing goes to an input field', async () => {
            const handler = registerSequence();

            pressKey('g');
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true}));
            input.remove();
            pressKey('g');
            await flushFrames();

            expect(handler).not.toHaveBeenCalled();
        });

        it('cancels a pending sequence when pass-through arms', async () => {
            const handler = registerSequence();

            pressKey('g'); // pending
            pressCtrl('v'); // arm pass-through — cancels the sequence
            pressKey('g'); // passed through to the page
            pressKey('g'); // fresh prefix, not a completion
            await flushFrames();

            expect(handler).not.toHaveBeenCalled();
        });

        it('never starts a sequence from a passed-through key', () => {
            registerSequence();

            pressCtrl('v');
            const event = new KeyboardEvent('keydown', {key: 'g', bubbles: true, cancelable: true});
            document.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(false);
            expect(Notifications.show).not.toHaveBeenCalledWith(
                expect.objectContaining({markdown: expect.stringContaining('pending')}),
            );
        });

        it('clears pending state on unlisten', () => {
            const dismiss = vi.fn();
            vi.mocked(Notifications.show).mockReturnValueOnce({dismiss} as never);
            registerSequence();

            pressKey('g');
            registry.unlisten();

            expect(dismiss).toHaveBeenCalled();
            expect(() => vi.advanceTimersByTime(SEQUENCE_TTL_MS + 1)).not.toThrow();
        });

        it('clear() removes sequences and resets pending state', async () => {
            const handler = registerSequence();

            pressKey('g');
            registry.clear();
            pressKey('g');
            pressKey('g');
            await flushFrames();

            expect(handler).not.toHaveBeenCalled();
        });

        it('lists a sequence as its concatenated keys in the help overlay', () => {
            registerSequence();
            registry.showHelp();

            const kbds = Array.from(document.querySelectorAll('kbd')).map((el) => el.textContent);
            expect(kbds).toContain('gg');
            registry.hideHelp();
        });

        it('unregisterSequence removes the sequence and its prefix', () => {
            registerSequence();
            registry.unregisterSequence(['g', 'g']);

            const event = new KeyboardEvent('keydown', {key: 'g', bubbles: true, cancelable: true});
            document.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(false);
        });

        it('rejects Escape as a sequence step and bindings with neither key nor sequence', () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const handler = vi.fn();

            registry.register({sequence: ['g', 'Escape'], description: 'bad', handler});
            registry.register({description: 'worse', handler});

            expect(error).toHaveBeenCalledTimes(2);
            pressKey('g');
            expect(Notifications.show).not.toHaveBeenCalled();
            error.mockRestore();
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
