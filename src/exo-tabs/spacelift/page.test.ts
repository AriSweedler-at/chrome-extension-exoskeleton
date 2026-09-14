import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

vi.mock('@exo/lib/keybindings', () => ({
    keybindings: {register: vi.fn(), registerAll: vi.fn(), listen: vi.fn()},
}));

async function importPageModule() {
    await import('@exo/exo-tabs/spacelift/page');
    const {keybindings} = await import('@exo/lib/keybindings');
    return keybindings;
}

describe('spacelift page module', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('registers Shift+E anywhere on Spacelift, gated by the stack rotation', async () => {
        vi.stubGlobal('location', {href: 'https://spacelift.shadowbox.cloud/runs'});

        const keybindings = await importPageModule();

        expect(keybindings.register).toHaveBeenCalledWith(
            expect.objectContaining({key: 'E', modifiers: {shift: true}, context: 'Spacelift'}),
        );
        expect(keybindings.listen).toHaveBeenCalled();

        // SPA: the guard reads the URL at keypress time.
        const binding = vi.mocked(keybindings.register).mock.calls[0][0];
        expect(binding.when?.()).toBe(false);
        vi.stubGlobal('location', {
            href: 'https://spacelift.shadowbox.cloud/stack/sendsafely-alpha',
        });
        expect(binding.when?.()).toBe(true);
    });

    it('registers nothing on non-Spacelift pages', async () => {
        vi.stubGlobal('location', {href: 'https://example.com/page'});

        const keybindings = await importPageModule();

        expect(keybindings.register).not.toHaveBeenCalled();
        expect(keybindings.listen).not.toHaveBeenCalled();
    });
});
