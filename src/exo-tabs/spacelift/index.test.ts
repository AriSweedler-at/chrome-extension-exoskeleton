import {describe, it, expect} from 'vitest';
import {
    isSpaceliftStackPage,
    getNextEnvironmentUrl,
    getPrevEnvironmentUrl,
    getAdjacentEnvironments,
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

describe('getPrevEnvironmentUrl', () => {
    it('rotates staging → alpha', () => {
        expect(
            getPrevEnvironmentUrl('https://spacelift.shadowbox.cloud/stack/sendsafely-staging'),
        ).toBe('https://spacelift.shadowbox.cloud/stack/sendsafely-alpha');
    });

    it('rotates production → staging', () => {
        expect(
            getPrevEnvironmentUrl('https://spacelift.shadowbox.cloud/stack/sendsafely-production'),
        ).toBe('https://spacelift.shadowbox.cloud/stack/sendsafely-staging');
    });

    it('rotates alpha → production', () => {
        expect(
            getPrevEnvironmentUrl('https://spacelift.shadowbox.cloud/stack/sendsafely-alpha'),
        ).toBe('https://spacelift.shadowbox.cloud/stack/sendsafely-production');
    });

    it('returns undefined for unknown suffix', () => {
        expect(
            getPrevEnvironmentUrl('https://spacelift.shadowbox.cloud/stack/sendsafely'),
        ).toBeUndefined();
    });
});

describe('getAdjacentEnvironments', () => {
    it('returns prev and next for staging', () => {
        expect(
            getAdjacentEnvironments('https://spacelift.shadowbox.cloud/stack/sendsafely-staging'),
        ).toEqual({prev: 'alpha', next: 'production'});
    });

    it('returns prev and next for production', () => {
        expect(
            getAdjacentEnvironments(
                'https://spacelift.shadowbox.cloud/stack/sendsafely-production',
            ),
        ).toEqual({prev: 'staging', next: 'alpha'});
    });

    it('returns prev and next for alpha', () => {
        expect(
            getAdjacentEnvironments('https://spacelift.shadowbox.cloud/stack/sendsafely-alpha'),
        ).toEqual({prev: 'production', next: 'staging'});
    });

    it('returns undefined for unknown suffix', () => {
        expect(
            getAdjacentEnvironments('https://spacelift.shadowbox.cloud/stack/sendsafely'),
        ).toBeUndefined();
    });
});
