import {describe, it, expect} from 'vitest';
import {
    getPipelineFilters,
    getIsolatedPipeline,
    getApplicationName,
    isExecutionsView,
    isStackedDetailsView,
    setPipelineFilter,
    transformPipelineFilters,
    buildIsolatedExecutionUrl,
    buildIsolatedPipelineListUrl,
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

    describe('getApplicationName', () => {
        it('extracts the application from an executions URL', () => {
            expect(getApplicationName(BASE)).toBe('hyperbase-deploy');
        });

        it('decodes percent-encoded application names', () => {
            expect(
                getApplicationName(
                    'https://spinnaker.k8s.shadowbox.cloud/#/applications/my%20app/executions',
                ),
            ).toBe('my app');
        });

        it('returns null when no application segment exists', () => {
            expect(getApplicationName('https://spinnaker.k8s.shadowbox.cloud/#/search')).toBeNull();
            expect(getApplicationName('not-a-url')).toBeNull();
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

    describe('isStackedDetailsView', () => {
        it('is true on stacked details URLs', () => {
            expect(
                isStackedDetailsView(
                    'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/details/01KYQA4SMS5STF94WB38DZY1A4?stage=0',
                ),
            ).toBe(true);
        });

        it('is false on plain executions views and malformed URLs', () => {
            expect(isStackedDetailsView(BASE)).toBe(false);
            expect(isStackedDetailsView('not-a-url')).toBe(false);
        });
    });

    describe('buildIsolatedExecutionUrl', () => {
        it('rewrites app and path, keeps params, and sets the pipeline filter', () => {
            const result = buildIsolatedExecutionUrl(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/details/01KYQA4SMS5STF94WB38DZY1A4?stage=0&step=0&details=webhookConfig',
                {
                    application: 'worker-assigner',
                    executionId: '01KYQA4SMS5STF94WB38DZY1A4',
                    pipelineName: 'Deploy worker-assigner PRODUCTION',
                },
            );
            expect(result).toBe(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/worker-assigner/executions/01KYQA4SMS5STF94WB38DZY1A4?stage=0&step=0&details=webhookConfig&pipeline=Deploy%20worker-assigner%20PRODUCTION',
            );
        });

        it('works without an existing hash query', () => {
            const result = buildIsolatedExecutionUrl(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions/details/01KYQA4SMS5STF94WB38DZY1A4',
                {application: 'svc', executionId: '01KYQA4SMS5STF94WB38DZY1A4', pipelineName: 'P'},
            );
            expect(result).toBe(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/svc/executions/01KYQA4SMS5STF94WB38DZY1A4?pipeline=P',
            );
        });
    });

    describe('buildIsolatedPipelineListUrl', () => {
        it('drops the run and its params, setting only q and the pipeline filter', () => {
            const result = buildIsolatedPipelineListUrl(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01KYWDY7DH8Y22MT8VG0GDY42H?q=Deploy%20Pro&pipeline=Deploy%20PRODUCTION&stage=0&step=0&details=webhookConfig',
                {application: 'hyperbase-deploy', pipelineName: 'Deploy PRODUCTION'},
            );
            expect(result).toBe(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions?q=Deploy%20PRODUCTION&pipeline=Deploy%20PRODUCTION',
            );
        });

        it('keeps the host, so the environment is preserved', () => {
            const result = buildIsolatedPipelineListUrl(
                'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/hyperbase-deploy/executions',
                {application: 'hyperbase-deploy', pipelineName: 'Deploy ALPHA'},
            );
            expect(result).toBe(
                'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/hyperbase-deploy/executions?q=Deploy%20ALPHA&pipeline=Deploy%20ALPHA',
            );
        });

        it('can retarget a different application', () => {
            const result = buildIsolatedPipelineListUrl(`${BASE}?stage=2`, {
                application: 'other-app',
                pipelineName: 'P',
            });
            expect(result).toBe(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/other-app/executions?q=P&pipeline=P',
            );
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

    describe('transformPipelineFilters', () => {
        const upper = (name: string) => name.toUpperCase();

        it('rewrites the filter value, preserving other params', () => {
            expect(
                transformPipelineFilters(`${BASE}?pipeline=Deploy%20web&stage=0&step=0`, upper),
            ).toBe(`${BASE}?stage=0&step=0&pipeline=DEPLOY%20WEB`);
        });

        it('rewrites every filter when several are checked', () => {
            const result = transformPipelineFilters(`${BASE}?pipeline=One&pipeline=Two`, upper);
            expect(getPipelineFilters(result)).toEqual(['ONE', 'TWO']);
        });

        it('leaves URLs without a filter untouched', () => {
            expect(transformPipelineFilters(`${BASE}?stage=2`, upper)).toBe(`${BASE}?stage=2`);
            expect(transformPipelineFilters(BASE, upper)).toBe(BASE);
        });
    });
});
