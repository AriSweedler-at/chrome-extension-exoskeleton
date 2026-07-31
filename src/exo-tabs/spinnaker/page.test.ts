import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

vi.mock('@exo/lib/keybindings', () => ({
    keybindings: {
        register: vi.fn(),
        registerAll: vi.fn(),
        listen: vi.fn(),
    },
}));
vi.mock('@exo/exo-tabs/spinnaker/actions', () => ({
    toggleExecution: vi.fn(),
    isolatePipeline: vi.fn(),
    isolateDeployPipeline: vi.fn(),
    openMonitoringLinks: vi.fn(),
    jumpToLastPipeline: vi.fn(),
    climbToParentExecution: vi.fn(),
}));

const SPINNAKER_URL = 'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions';

function stubStorage(values: Record<string, unknown>) {
    vi.stubGlobal('chrome', {
        storage: {
            local: {
                get: vi.fn((_key: string, callback: (result: Record<string, unknown>) => void) => {
                    callback(values);
                }),
            },
        },
    });
}

async function importPageModule() {
    await import('@exo/exo-tabs/spinnaker/page');
    // Let the async enablement check settle
    await new Promise((resolve) => setTimeout(resolve, 0));
    const {keybindings} = await import('@exo/lib/keybindings');
    return keybindings;
}

describe('spinnaker page module', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('registers all Spinnaker keybindings when enabled by default', async () => {
        vi.stubGlobal('location', {href: SPINNAKER_URL});
        stubStorage({});

        const keybindings = await importPageModule();

        expect(keybindings.registerAll).toHaveBeenCalledTimes(1);
        const bindings = vi.mocked(keybindings.registerAll).mock.calls[0][0];
        expect(
            bindings.map((b: {key?: string; sequence?: string[]}) => b.key ?? b.sequence?.join('')),
        ).toEqual(['e', 'i', 'd', 'M', 'G', 'gg']);
        expect(keybindings.listen).toHaveBeenCalled();
    });

    it('registers nothing when exorun-spinnaker is false', async () => {
        vi.stubGlobal('location', {href: SPINNAKER_URL});
        stubStorage({'exorun-spinnaker': false});

        const keybindings = await importPageModule();

        expect(keybindings.registerAll).not.toHaveBeenCalled();
        expect(keybindings.listen).not.toHaveBeenCalled();
    });

    it('registers nothing on non-Spinnaker pages', async () => {
        vi.stubGlobal('location', {href: 'https://example.com/page'});
        stubStorage({});

        const keybindings = await importPageModule();

        expect(keybindings.registerAll).not.toHaveBeenCalled();
        expect(keybindings.listen).not.toHaveBeenCalled();
    });
});
