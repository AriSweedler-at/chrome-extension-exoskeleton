import {describe, it, expect, vi, beforeEach} from 'vitest';
import {
    nextEnvironment,
    makeEnvCycleAction,
    type EnvironmentInfo,
} from '@exo/lib/popup-exo-tabs/environment-ui';
import {navigateAndToast} from '@exo/lib/service-worker/navigate-with-toast';

vi.mock('@exo/lib/service-worker/navigate-with-toast', () => ({
    navigateAndToast: vi.fn(),
}));

const env = (name: string, current = false): EnvironmentInfo => ({
    env: name,
    url: `https://${name}.example.com/`,
    current,
});

describe('nextEnvironment', () => {
    it('returns the environment after the current one', () => {
        const envs = [env('alpha', true), env('staging'), env('production')];
        expect(nextEnvironment(envs)?.env).toBe('staging');
    });

    it('wraps around from the last environment to the first', () => {
        const envs = [env('alpha'), env('staging'), env('production', true)];
        expect(nextEnvironment(envs)?.env).toBe('alpha');
    });

    it('falls back to the first environment when none is current', () => {
        const envs = [env('alpha'), env('staging')];
        expect(nextEnvironment(envs)?.env).toBe('alpha');
    });

    it('returns undefined for undefined or empty input', () => {
        expect(nextEnvironment(undefined)).toBeUndefined();
        expect(nextEnvironment([])).toBeUndefined();
    });

    it('cycles a single environment back to itself', () => {
        const envs = [env('alpha', true)];
        expect(nextEnvironment(envs)?.env).toBe('alpha');
    });
});

describe('makeEnvCycleAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('navigates to the next environment and reports handled', async () => {
        const action = makeEnvCycleAction(() => [env('alpha', true), env('staging')]);

        await expect(action(7, 'https://alpha.example.com/')).resolves.toBe(true);
        expect(navigateAndToast).toHaveBeenCalledWith(
            7,
            'https://staging.example.com/',
            expect.objectContaining({message: 'Navigating to staging'}),
        );
    });

    it('reports unhandled without navigating when the page has no environments', async () => {
        const action = makeEnvCycleAction(() => undefined);

        await expect(action(7, 'https://other.example.com/')).resolves.toBe(false);
        expect(navigateAndToast).not.toHaveBeenCalled();
    });

    it('toasts the custom label when one is given', async () => {
        const action = makeEnvCycleAction(
            () => [env('alpha', true), env('staging')],
            (next) => `stack-${next.env}`,
        );

        await action(7, 'https://alpha.example.com/');
        expect(navigateAndToast).toHaveBeenCalledWith(
            7,
            'https://staging.example.com/',
            expect.objectContaining({message: 'Navigating to stack-staging'}),
        );
    });
});
