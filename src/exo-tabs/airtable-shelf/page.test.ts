import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import type {Keybinding} from '@exo/lib/keybindings';
import {Notifications} from '@exo/lib/toast-notification';

vi.mock('@exo/lib/keybindings', () => ({
    keybindings: {register: vi.fn(), registerAll: vi.fn(), listen: vi.fn()},
}));
vi.mock('@exo/lib/toast-notification', () => ({
    Notifications: {show: vi.fn()},
    NotificationType: {Success: 'success', Error: 'error', Default: 'default'},
}));

const SHELF_URL =
    'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6?detail=eyJwYWdlSWQiOiJwYWdaemxzc210Q1FsRDQ4TSIsInJvd0lkIjoicmVjVDVTWXBGSnMxRUNVU0siLCJzaG93Q29tbWVudHMiOmZhbHNlLCJxdWVyeU9yaWdpbkhpbnQiOm51bGx9';
const FULLSCREEN_URL = 'https://airtable.com/apptivTqaoebkrmV1/pagZzlssmtCQlD48M/recT5SYpFJs1ECUSK';

function stubReferrer(referrer: string) {
    Object.defineProperty(document, 'referrer', {value: referrer, configurable: true});
}

async function importPageModule() {
    const module = await import('@exo/exo-tabs/airtable-shelf/page');
    const {keybindings} = await import('@exo/lib/keybindings');
    const bindings = vi.mocked(keybindings.registerAll).mock.calls[0]?.[0] ?? [];
    return {module, keybindings, bindings: bindings as Keybinding[]};
}

describe('airtable-shelf page module', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        stubReferrer('');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("registers 'i' (isolate) and 'I' (return) on Airtable pages", async () => {
        vi.stubGlobal('location', {href: SHELF_URL});

        const {keybindings, bindings} = await importPageModule();

        expect(bindings.map((b) => b.key)).toEqual(['i', 'I']);
        expect(bindings[1].modifiers).toEqual({shift: true});
        expect(keybindings.listen).toHaveBeenCalled();
    });

    it('registers nothing off Airtable hosts', async () => {
        vi.stubGlobal('location', {href: 'https://github.com/org/repo'});

        const {keybindings} = await importPageModule();

        expect(keybindings.registerAll).not.toHaveBeenCalled();
        expect(keybindings.listen).not.toHaveBeenCalled();
    });

    it("'i' only intercepts while a shelf is open (when-guard)", async () => {
        vi.stubGlobal('location', {href: SHELF_URL});
        const {bindings} = await importPageModule();
        const isolate = bindings[0];

        expect(isolate.when?.()).toBe(true);

        vi.stubGlobal('location', {href: FULLSCREEN_URL});
        expect(isolate.when?.()).toBe(false);
    });

    it("'i' navigates a shelf view to its fullscreen URL", async () => {
        vi.stubGlobal('location', {href: SHELF_URL});
        const {module} = await importPageModule();

        module.isolateShelf();

        expect(window.location.href).toBe(FULLSCREEN_URL);
    });

    it("'I' navigates back from the fullscreen view whose referrer is the shelf", async () => {
        vi.stubGlobal('location', {href: FULLSCREEN_URL});
        stubReferrer(SHELF_URL);
        const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
        const {module} = await importPageModule();

        module.returnFromIsolation();

        expect(back).toHaveBeenCalledOnce();
        expect(Notifications.show).not.toHaveBeenCalled();
    });

    it("'I' errors on a fullscreen view not entered via isolation", async () => {
        vi.stubGlobal('location', {href: FULLSCREEN_URL});
        const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
        const {module} = await importPageModule();

        module.returnFromIsolation();

        expect(back).not.toHaveBeenCalled();
        expect(Notifications.show).toHaveBeenCalledWith({
            markdown:
                "Can't return to a shelf — this fullscreen view wasn't opened via isolate (`i`)",
            type: 'error',
        });
    });
});
