import {describe, it, expect} from 'vitest';
import {
    isSpaceliftStackPage,
    getNextEnvironmentUrl,
    getEnvironments,
} from '@exo/exo-tabs/spacelift';

describe('isSpaceliftStackPage', () => {
    it('returns true for stack pages', () => {
        expect(
            isSpaceliftStackPage('https://spacelift.shadowbox.cloud/stack/sendsafely-staging'),
        ).toBe(true);
    });

    it('returns false for non-stack pages', () => {
        expect(isSpaceliftStackPage('https://spacelift.shadowbox.cloud/runs')).toBe(false);
    });

    it('returns false for other hosts', () => {
        expect(isSpaceliftStackPage('https://github.com/stack/foo')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
        expect(isSpaceliftStackPage('not-a-url')).toBe(false);
    });
});

describe('getNextEnvironmentUrl', () => {
    it('rotates staging → production', () => {
        expect(
            getNextEnvironmentUrl('https://spacelift.shadowbox.cloud/stack/sendsafely-staging'),
        ).toBe('https://spacelift.shadowbox.cloud/stack/sendsafely-production');
    });

    it('rotates production → alpha', () => {
        expect(
            getNextEnvironmentUrl('https://spacelift.shadowbox.cloud/stack/sendsafely-production'),
        ).toBe('https://spacelift.shadowbox.cloud/stack/sendsafely-alpha');
    });

    it('rotates alpha → staging', () => {
        expect(
            getNextEnvironmentUrl('https://spacelift.shadowbox.cloud/stack/sendsafely-alpha'),
        ).toBe('https://spacelift.shadowbox.cloud/stack/sendsafely-staging');
    });

    it('returns undefined for stack names without a known environment suffix', () => {
        expect(
            getNextEnvironmentUrl('https://spacelift.shadowbox.cloud/stack/sendsafely'),
        ).toBeUndefined();
    });

    it('returns undefined for non-stack URLs', () => {
        expect(getNextEnvironmentUrl('https://spacelift.shadowbox.cloud/runs')).toBeUndefined();
    });

    it('returns undefined for invalid URLs', () => {
        expect(getNextEnvironmentUrl('not-a-url')).toBeUndefined();
    });
});

describe('getEnvironments', () => {
    it('returns all three environments with correct current flag', () => {
        const envs = getEnvironments('https://spacelift.shadowbox.cloud/stack/sendsafely-staging');
        expect(envs).toEqual([
            {
                env: 'alpha',
                url: 'https://spacelift.shadowbox.cloud/stack/sendsafely-alpha',
                current: false,
            },
            {
                env: 'staging',
                url: 'https://spacelift.shadowbox.cloud/stack/sendsafely-staging',
                current: true,
            },
            {
                env: 'production',
                url: 'https://spacelift.shadowbox.cloud/stack/sendsafely-production',
                current: false,
            },
        ]);
    });

    it('marks production as current', () => {
        const envs = getEnvironments(
            'https://spacelift.shadowbox.cloud/stack/sendsafely-production',
        );
        expect(envs?.find((e) => e.current)?.env).toBe('production');
    });

    it('marks alpha as current', () => {
        const envs = getEnvironments('https://spacelift.shadowbox.cloud/stack/sendsafely-alpha');
        expect(envs?.find((e) => e.current)?.env).toBe('alpha');
    });

    it('returns undefined for unknown suffix', () => {
        expect(
            getEnvironments('https://spacelift.shadowbox.cloud/stack/sendsafely'),
        ).toBeUndefined();
    });

    it('returns undefined for non-stack URLs', () => {
        expect(getEnvironments('https://spacelift.shadowbox.cloud/runs')).toBeUndefined();
    });
});
