import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {KeybindingRegistry} from '@exo/lib/keybindings';

describe('KeybindingRegistry', () => {
    let registry: KeybindingRegistry;

    beforeEach(() => {
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

    it('should fire handler for simple key', () => {
        const handler = vi.fn();
        registry.register({key: 'x', description: 'test', handler});

        pressKey('x');

        expect(handler).toHaveBeenCalledOnce();
    });

    it('should fire handler for ? key (requires shift)', () => {
        const handler = vi.fn();
        registry.register({key: '?', description: 'test', handler});

        // Pressing ? on a keyboard sends shiftKey: true, key: '?'
        pressKey('?', {shiftKey: true});

        expect(handler).toHaveBeenCalledOnce();
    });

    it('should NOT fire lowercase key handler when shift is held', () => {
        const handler = vi.fn();
        registry.register({key: 'x', description: 'test', handler});

        // Shift+X sends key: 'X', shiftKey: true
        pressKey('X', {shiftKey: true});

        expect(handler).not.toHaveBeenCalled();
    });

    it('should fire handler for explicit shift+letter binding', () => {
        const handler = vi.fn();
        registry.register({
            key: 'x',
            description: 'test',
            handler,
            modifiers: {shift: true},
        });

        pressKey('X', {shiftKey: true});

        expect(handler).toHaveBeenCalledOnce();
    });

    it('should not fire when typing in an input field', () => {
        const handler = vi.fn();
        registry.register({key: 'x', description: 'test', handler});

        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'x', bubbles: true}));

        expect(handler).not.toHaveBeenCalled();
        input.remove();
    });

    it('should show help overlay on ?', () => {
        // ? help is auto-registered in constructor
        pressKey('?', {shiftKey: true});

        const overlay = document.querySelector('[style*="position: fixed"]');
        expect(overlay).not.toBeNull();

        // Clean up
        registry.hideHelp();
    });
});
