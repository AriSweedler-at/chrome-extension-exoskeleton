import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
    toggleExecution,
    isolatePipeline,
    isolateDeployPipeline,
    jumpToLastPipeline,
} from '@exo/exo-tabs/spinnaker/actions';
import * as domUtils from '@exo/exo-tabs/spinnaker/dom-utils';
import {Notifications} from '@exo/lib/toast-notification';

vi.mock('@exo/lib/toast-notification', () => ({
    Notifications: {show: vi.fn()},
}));

describe('spinnaker actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('toggleExecution', () => {
        it('should click execution details link when found', () => {
            const clickFn = vi.fn();
            const mockLink = {click: clickFn} as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findExecutionDetailsLink').mockReturnValue(mockLink);

            toggleExecution();

            expect(domUtils.findExecutionDetailsLink).toHaveBeenCalled();
            expect(clickFn).toHaveBeenCalled();
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Toggled execution details',
            });
        });

        it('should show error notification when link not found', () => {
            vi.spyOn(domUtils, 'findExecutionDetailsLink').mockReturnValue(null);

            toggleExecution();

            expect(domUtils.findExecutionDetailsLink).toHaveBeenCalled();
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Execution details link not found',
            });
        });
    });

    describe('jumpToLastPipeline', () => {
        it('scrolls the last stacked pipeline row to the top of the viewport', () => {
            const scrollIntoView = vi.fn();
            const row = {scrollIntoView} as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findLastStackedPipelineRow').mockReturnValue(row);

            jumpToLastPipeline();

            expect(scrollIntoView).toHaveBeenCalledWith({block: 'start'});
            expect(Notifications.show).not.toHaveBeenCalled();
        });

        it('notifies when the page has no stacked pipeline rows', () => {
            vi.spyOn(domUtils, 'findLastStackedPipelineRow').mockReturnValue(null);

            jumpToLastPipeline();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No stacked pipeline rows on this page',
            });
        });
    });

    describe('isolateDeployPipeline', () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('jumps from a run to the isolated Deploy pipeline of the environment', () => {
            vi.stubGlobal('location', {
                href: 'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01KYWDY7DH8Y22MT8VG0GDY42H?q=Deploy%20Pro&pipeline=Deploy%20PRODUCTION&stage=0&step=0&details=webhookConfig',
            });

            isolateDeployPipeline();

            expect(window.location.href).toBe(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions?q=Deploy%20PRODUCTION&pipeline=Deploy%20PRODUCTION',
            );
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Isolated pipeline: Deploy PRODUCTION',
            });
        });

        it.each([
            ['https://spinnaker.k8s.alpha-shadowbox.cloud', 'Deploy%20ALPHA', 'Deploy ALPHA'],
            ['https://spinnaker.k8s.staging-shadowbox.cloud', 'Deploy%20STAGING', 'Deploy STAGING'],
        ])('targets the environment of the %s host', (host, encoded, pipelineName) => {
            vi.stubGlobal('location', {
                href: `${host}/#/applications/hyperbase-deploy/executions`,
            });

            isolateDeployPipeline();

            expect(window.location.href).toBe(
                `${host}/#/applications/hyperbase-deploy/executions?q=${encoded}&pipeline=${encoded}`,
            );
            expect(Notifications.show).toHaveBeenCalledWith({
                message: `Isolated pipeline: ${pipelineName}`,
            });
        });

        it('refuses to run outside the hyperbase-deploy application', () => {
            const url = 'https://spinnaker.k8s.shadowbox.cloud/#/applications/myapp/executions';
            vi.stubGlobal('location', {href: url});

            isolateDeployPipeline();

            expect(window.location.href).toBe(url);
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Only works in the hyperbase-deploy application',
            });
        });
    });

    describe('isolatePipeline', () => {
        const EXECUTION_URL =
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN5GWDEJ5088Y9QZ4JPG2C0?stage=2&step=0&details=runJobConfig';

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('should navigate to the pipeline-filtered URL and notify', async () => {
            vi.stubGlobal('location', {href: EXECUTION_URL});
            vi.spyOn(domUtils, 'findPipelineNameForExecution').mockReturnValue(
                'Blue Green Provisioning PRODUCTION',
            );

            await isolatePipeline();

            expect(domUtils.findPipelineNameForExecution).toHaveBeenCalledWith(
                '01HPN5GWDEJ5088Y9QZ4JPG2C0',
            );
            expect(window.location.href).toBe(
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN5GWDEJ5088Y9QZ4JPG2C0?stage=2&step=0&details=runJobConfig&pipeline=Blue%20Green%20Provisioning%20PRODUCTION',
            );
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Isolated pipeline: Blue Green Provisioning PRODUCTION',
            });
        });

        it('should show "No execution found" when the URL has no execution', async () => {
            vi.stubGlobal('location', {
                href: 'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions',
            });

            await isolatePipeline();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No execution found in URL',
            });
        });

        it('should show an error when the pipeline name cannot be found', async () => {
            vi.stubGlobal('location', {href: EXECUTION_URL});
            vi.spyOn(domUtils, 'findPipelineNameForExecution').mockReturnValue(null);

            await isolatePipeline();

            expect(window.location.href).toBe(EXECUTION_URL);
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Could not determine the pipeline for this execution',
            });
        });

        describe('on a stacked details view', () => {
            const STACKED_URL =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/details/01KYQA4SMS5STF94WB38DZY1A4?stage=0&step=0&details=webhookConfig';

            it('jumps to the isolated view under the payload-declared application', async () => {
                vi.stubGlobal('location', {href: STACKED_URL});
                vi.spyOn(domUtils, 'findStackedPipelineName').mockReturnValue(
                    'Deploy worker-assigner PRODUCTION',
                );
                vi.spyOn(domUtils, 'findApplicationForExecution').mockReturnValue(
                    'worker-assigner',
                );

                await isolatePipeline();

                expect(domUtils.findStackedPipelineName).toHaveBeenCalledWith(
                    '01KYQA4SMS5STF94WB38DZY1A4',
                );
                expect(domUtils.findApplicationForExecution).toHaveBeenCalledWith(
                    '01KYQA4SMS5STF94WB38DZY1A4',
                );
                expect(window.location.href).toBe(
                    'https://spinnaker.k8s.shadowbox.cloud/#/applications/worker-assigner/executions/01KYQA4SMS5STF94WB38DZY1A4?stage=0&step=0&details=webhookConfig&pipeline=Deploy%20worker-assigner%20PRODUCTION',
                );
                expect(Notifications.show).toHaveBeenCalledWith({
                    message:
                        'Isolated pipeline: Deploy worker-assigner PRODUCTION (worker-assigner)',
                });
            });

            it('opens the event stage and polls when the payload is not yet rendered', async () => {
                vi.stubGlobal('location', {href: STACKED_URL});
                vi.spyOn(domUtils, 'findStackedPipelineName').mockReturnValue(
                    'Deploy worker-assigner PRODUCTION',
                );
                // Absent before the click, present once the pane renders.
                vi.spyOn(domUtils, 'findApplicationForExecution')
                    .mockReturnValueOnce(null)
                    .mockReturnValue('worker-assigner');
                const click = vi.fn();
                vi.spyOn(domUtils, 'findEventStageMarker').mockReturnValue({
                    click,
                } as unknown as HTMLElement);

                await isolatePipeline();

                expect(click).toHaveBeenCalled();
                expect(window.location.href).toContain('/applications/worker-assigner/executions/');
                expect(Notifications.show).toHaveBeenCalledWith({
                    message:
                        'Isolated pipeline: Deploy worker-assigner PRODUCTION (worker-assigner)',
                });
            });

            it('gives up when no payload names the application and no event stage exists', async () => {
                vi.stubGlobal('location', {href: STACKED_URL});
                vi.spyOn(domUtils, 'findStackedPipelineName').mockReturnValue(
                    'K8s Meta Pipeline PRODUCTION',
                );
                vi.spyOn(domUtils, 'findApplicationForExecution').mockReturnValue(null);
                vi.spyOn(domUtils, 'findEventStageMarker').mockReturnValue(null);

                await isolatePipeline();

                expect(window.location.href).toBe(STACKED_URL);
                expect(Notifications.show).toHaveBeenCalledWith({
                    message: 'Could not determine the application for this execution',
                });
            });

            it('shows an error when the stacked pipeline name cannot be found', async () => {
                vi.stubGlobal('location', {href: STACKED_URL});
                vi.spyOn(domUtils, 'findStackedPipelineName').mockReturnValue(null);

                await isolatePipeline();

                expect(window.location.href).toBe(STACKED_URL);
                expect(Notifications.show).toHaveBeenCalledWith({
                    message: 'Could not determine the pipeline for this execution',
                });
            });
        });
    });
});
