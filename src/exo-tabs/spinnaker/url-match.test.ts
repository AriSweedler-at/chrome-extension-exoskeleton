import {describe, it, expect} from 'vitest';
import {
    isSpinnakerPage,
    isSpinnakerSearchPage,
    getEnvironments,
    getNextEnvironmentUrl,
} from '@exo/exo-tabs/spinnaker/url-match';

describe('isSpinnakerPage', () => {
    it('returns true for shadowbox Spinnaker', () => {
        expect(
            isSpinnakerPage('https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions'),
        ).toBe(true);
    });

    it('returns true for alpha-shadowbox Spinnaker', () => {
        expect(
            isSpinnakerPage(
                'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/app/executions',
            ),
        ).toBe(true);
    });

    it('returns false for non-Spinnaker URLs', () => {
        expect(isSpinnakerPage('https://github.com/owner/repo')).toBe(false);
    });

    it('returns false for URLs containing spinnaker as substring', () => {
        expect(isSpinnakerPage('https://docs.google.com/d/spinnaker-notes')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
        expect(isSpinnakerPage('not-a-url')).toBe(false);
    });
});

describe('isSpinnakerSearchPage', () => {
    it('returns true for spinnaker.k8s.shadowbox.cloud search page', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/search')).toBe(true);
    });

    it('returns true for spinnaker.k8s.alpha-shadowbox.cloud search page', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.alpha-shadowbox.cloud/#/search')).toBe(
            true,
        );
    });

    it('returns true for search page with query params', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/search?q=test')).toBe(
            true,
        );
    });

    it('returns false for non-search Spinnaker pages', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/applications')).toBe(
            false,
        );
    });

    it('returns false for non-Spinnaker URLs', () => {
        expect(isSpinnakerSearchPage('https://github.com/owner/repo')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
        expect(isSpinnakerSearchPage('not-a-url')).toBe(false);
    });
});

describe('getEnvironments', () => {
    it('returns 2 envs with production marked current', () => {
        const envs = getEnvironments(
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions',
        );
        expect(envs).toHaveLength(2);
        expect(envs?.map((e) => e.env)).toEqual(['alpha', 'production']);
        expect(envs?.find((e) => e.current)?.env).toBe('production');
    });

    it('returns 2 envs with alpha marked current', () => {
        const envs = getEnvironments(
            'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/app/executions',
        );
        expect(envs?.find((e) => e.current)?.env).toBe('alpha');
    });

    it('preserves hash-based routing path', () => {
        const url =
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT?stage=2&step=0&details=runJobConfig';
        const envs = getEnvironments(url);
        for (const env of envs!) {
            const parsed = new URL(env.url);
            expect(parsed.hash).toBe(
                '#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT?stage=2&step=0&details=runJobConfig',
            );
        }
    });

    it('returns undefined for non-Spinnaker URL', () => {
        expect(getEnvironments('https://example.com/foo')).toBeUndefined();
    });

    it('returns undefined for invalid URL', () => {
        expect(getEnvironments('not-a-url')).toBeUndefined();
    });
});

describe('getNextEnvironmentUrl', () => {
    it('cycles production → alpha', () => {
        const next = getNextEnvironmentUrl(
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions',
        );
        expect(new URL(next!).hostname).toBe('spinnaker.k8s.alpha-shadowbox.cloud');
    });

    it('cycles alpha → production', () => {
        const next = getNextEnvironmentUrl(
            'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/app/executions',
        );
        expect(new URL(next!).hostname).toBe('spinnaker.k8s.shadowbox.cloud');
    });

    it('returns undefined for non-Spinnaker URL', () => {
        expect(getNextEnvironmentUrl('https://example.com')).toBeUndefined();
    });
});
