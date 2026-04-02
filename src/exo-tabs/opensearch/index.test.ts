import {describe, it, expect} from 'vitest';
import {getEnvironments, getNextEnvironmentUrl} from '@exo/exo-tabs/opensearch';

describe('getEnvironments', () => {
    it('returns all 3 envs with production marked current', () => {
        const envs = getEnvironments('https://opensearch-applogs.shadowbox.cloud/app/discover');
        expect(envs).toHaveLength(3);
        expect(envs?.map((e) => e.env)).toEqual(['alpha', 'staging', 'production']);
        expect(envs?.find((e) => e.current)?.env).toBe('production');
    });

    it('returns all 3 envs with staging marked current', () => {
        const envs = getEnvironments(
            'https://opensearch-applogs.staging-shadowbox.cloud/app/discover',
        );
        expect(envs?.find((e) => e.current)?.env).toBe('staging');
    });

    it('returns all 3 envs with alpha marked current', () => {
        const envs = getEnvironments(
            'https://opensearch-applogs.alpha-shadowbox.cloud/app/discover',
        );
        expect(envs?.find((e) => e.current)?.env).toBe('alpha');
    });

    it('preserves path across all returned URLs', () => {
        const envs = getEnvironments(
            'https://opensearch-applogs.shadowbox.cloud/app/discover#/view/some-id',
        );
        for (const env of envs!) {
            expect(new URL(env.url).pathname).toBe('/app/discover');
        }
    });

    it('preserves query string across all returned URLs', () => {
        const envs = getEnvironments(
            'https://opensearch-applogs.shadowbox.cloud/app/discover?_g=(time:(from:now-15m))&_a=(query:(language:lucene,query:%27hello%27))',
        );
        for (const env of envs!) {
            expect(new URL(env.url).search).toContain('_g=');
            expect(new URL(env.url).search).toContain('_a=');
        }
    });

    it('returns undefined for non-OpenSearch URL', () => {
        expect(getEnvironments('https://example.com/foo')).toBeUndefined();
    });

    it('returns undefined for invalid URL', () => {
        expect(getEnvironments('not-a-url')).toBeUndefined();
    });
});

describe('getNextEnvironmentUrl', () => {
    it('cycles alpha → staging', () => {
        const next = getNextEnvironmentUrl(
            'https://opensearch-applogs.alpha-shadowbox.cloud/app/discover',
        );
        expect(new URL(next!).hostname).toBe('opensearch-applogs.staging-shadowbox.cloud');
    });

    it('cycles staging → production', () => {
        const next = getNextEnvironmentUrl(
            'https://opensearch-applogs.staging-shadowbox.cloud/app/discover',
        );
        expect(new URL(next!).hostname).toBe('opensearch-applogs.shadowbox.cloud');
    });

    it('cycles production → alpha', () => {
        const next = getNextEnvironmentUrl(
            'https://opensearch-applogs.shadowbox.cloud/app/discover',
        );
        expect(new URL(next!).hostname).toBe('opensearch-applogs.alpha-shadowbox.cloud');
    });

    it('returns undefined for non-OpenSearch URL', () => {
        expect(getNextEnvironmentUrl('https://example.com')).toBeUndefined();
    });
});
