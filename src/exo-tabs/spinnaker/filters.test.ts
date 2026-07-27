import {describe, it, expect} from 'vitest';
import {
    getPipelineFilters,
    getIsolatedPipeline,
    isExecutionsView,
    setPipelineFilter,
} from '@exo/exo-tabs/spinnaker/filters';

const BASE =
    'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN5GWDEJ5088Y9QZ4JPG2C0';

describe('spinnaker filters', () => {
    describe('getPipelineFilters', () => {
        it('returns empty when no pipeline filter is set', () => {
            expect(getPipelineFilters(`${BASE}?stage=2&step=0`)).toEqual([]);
        });

        it('returns the single filtered pipeline, decoded', () => {
            expect(
                getPipelineFilters(`${BASE}?pipeline=Blue%20Green%20Provisioning%20PRODUCTION`),
            ).toEqual(['Blue Green Provisioning PRODUCTION']);
        });

        it('returns every checked pipeline', () => {
            expect(getPipelineFilters(`${BASE}?pipeline=One&pipeline=Two`)).toEqual(['One', 'Two']);
        });

        it('returns empty for malformed URLs', () => {
            expect(getPipelineFilters('not-a-url')).toEqual([]);
        });
    });

    describe('getIsolatedPipeline', () => {
        it('returns the pipeline when exactly one filter is active', () => {
            expect(getIsolatedPipeline(`${BASE}?pipeline=Deploy%20PRODUCTION&stage=2`)).toBe(
                'Deploy PRODUCTION',
            );
        });

        it('returns null with no filters', () => {
            expect(getIsolatedPipeline(`${BASE}?stage=2`)).toBeNull();
        });

        it('returns null with multiple filters', () => {
            expect(getIsolatedPipeline(`${BASE}?pipeline=One&pipeline=Two`)).toBeNull();
        });
    });

    describe('isExecutionsView', () => {
        it('is true on executions pages', () => {
            expect(isExecutionsView(BASE)).toBe(true);
            expect(
                isExecutionsView(
                    'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions?pipeline=X',
                ),
            ).toBe(true);
        });

        it('is false on other spinnaker pages', () => {
            expect(
                isExecutionsView('https://spinnaker.k8s.shadowbox.cloud/#/applications/app/config'),
            ).toBe(false);
        });

        it('is false for malformed URLs', () => {
            expect(isExecutionsView('not-a-url')).toBe(false);
        });
    });

    describe('setPipelineFilter', () => {
        it('adds the pipeline param, preserving existing params', () => {
            expect(
                setPipelineFilter(
                    `${BASE}?stage=2&step=0&details=runJobConfig`,
                    'Blue Green Provisioning PRODUCTION',
                ),
            ).toBe(
                `${BASE}?stage=2&step=0&details=runJobConfig&pipeline=Blue%20Green%20Provisioning%20PRODUCTION`,
            );
        });

        it('adds the pipeline param when the hash has no query', () => {
            expect(setPipelineFilter(BASE, 'Deploy')).toBe(`${BASE}?pipeline=Deploy`);
        });

        it('replaces all existing pipeline filters', () => {
            const result = setPipelineFilter(`${BASE}?pipeline=One&pipeline=Two&stage=2`, 'New');
            expect(result).toContain('pipeline=New');
            expect(result).not.toContain('pipeline=One');
            expect(result).not.toContain('pipeline=Two');
        });
    });
});
