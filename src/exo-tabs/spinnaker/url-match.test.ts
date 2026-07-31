import {describe, it, expect} from 'vitest';
import {
    isSpinnakerPage,
    isSpinnakerSearchPage,
    getEnvironments,
    getNextEnvironmentUrl,
    getSpinnakerEnvironment,
    environmentToken,
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

describe('getSpinnakerEnvironment', () => {
    it('maps each hostname to its environment', () => {
        expect(getSpinnakerEnvironment('https://spinnaker.k8s.shadowbox.cloud/#/foo')).toBe(
            'production',
        );
        expect(getSpinnakerEnvironment('https://spinnaker.k8s.staging-shadowbox.cloud/#/foo')).toBe(
            'staging',
        );
        expect(getSpinnakerEnvironment('https://spinnaker.k8s.alpha-shadowbox.cloud/#/foo')).toBe(
            'alpha',
        );
    });

    it('returns undefined for non-Spinnaker and invalid URLs', () => {
        expect(getSpinnakerEnvironment('https://github.com/owner/repo')).toBeUndefined();
        expect(getSpinnakerEnvironment('not-a-url')).toBeUndefined();
    });
});

describe('environmentToken', () => {
    it('returns the token pipeline names embed', () => {
        expect(environmentToken('production')).toBe('PRODUCTION');
        expect(environmentToken('staging')).toBe('STAGING');
        expect(environmentToken('alpha')).toBe('ALPHA');
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
    it('returns 3 envs with production marked current', () => {
        const envs = getEnvironments(
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions',
        );
        expect(envs).toHaveLength(3);
        expect(envs?.map((e) => e.env)).toEqual(['alpha', 'staging', 'production']);
        expect(envs?.find((e) => e.current)?.env).toBe('production');
    });

    it('returns 3 envs with alpha marked current', () => {
        const envs = getEnvironments(
            'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/app/executions',
        );
        expect(envs?.find((e) => e.current)?.env).toBe('alpha');
    });

    it('marks staging current on the staging host', () => {
        const envs = getEnvironments(
            'https://spinnaker.k8s.staging-shadowbox.cloud/#/applications/app/executions',
        );
        expect(envs?.find((e) => e.current)?.env).toBe('staging');
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
    it('cycles alpha → staging → production → alpha', () => {
        const path = '/#/applications/app/executions';
        expect(
            new URL(getNextEnvironmentUrl(`https://spinnaker.k8s.alpha-shadowbox.cloud${path}`)!)
                .hostname,
        ).toBe('spinnaker.k8s.staging-shadowbox.cloud');
        expect(
            new URL(getNextEnvironmentUrl(`https://spinnaker.k8s.staging-shadowbox.cloud${path}`)!)
                .hostname,
        ).toBe('spinnaker.k8s.shadowbox.cloud');
        expect(
            new URL(getNextEnvironmentUrl(`https://spinnaker.k8s.shadowbox.cloud${path}`)!)
                .hostname,
        ).toBe('spinnaker.k8s.alpha-shadowbox.cloud');
    });

    it('returns undefined for non-Spinnaker URL', () => {
        expect(getNextEnvironmentUrl('https://example.com')).toBeUndefined();
    });

    it('retargets the pipeline filter to the destination environment', () => {
        const next = getNextEnvironmentUrl(
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01KKF8684WK9RM252E798BBQ3W?pipeline=Continuous%20Migration%20PRODUCTION&stage=0&step=0&details=evaluateVariablesConfig',
        );
        expect(next).toBe(
            'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/hyperbase-deploy/executions/01KKF8684WK9RM252E798BBQ3W?stage=0&step=0&details=evaluateVariablesConfig&pipeline=Continuous%20Migration%20ALPHA',
        );
    });

    it('retargets whichever env token the pipeline name carries', () => {
        const next = getNextEnvironmentUrl(
            'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/app/executions?pipeline=Rollback%20Pipeline%20Group%20Non-App%20Worker%20PRODUCTION',
        );
        expect(next).toBe(
            'https://spinnaker.k8s.staging-shadowbox.cloud/#/applications/app/executions?pipeline=Rollback%20Pipeline%20Group%20Non-App%20Worker%20STAGING',
        );
    });

    it('preserves other hash params when switching environments', () => {
        const next = getNextEnvironmentUrl(
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions?stage=2',
        );
        expect(next).toBe(
            'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/app/executions?stage=2',
        );
    });
});
