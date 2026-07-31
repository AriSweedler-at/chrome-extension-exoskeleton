import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
    toggleExecution,
    isolatePipeline,
    isolateDeployPipeline,
    openMonitoringLinks,
    jumpToLastPipeline,
    climbToParentExecution,
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
        afterEach(() => {
            document.body.innerHTML = '';
        });

        it('scrolls the last stacked pipeline row to the top of the viewport', async () => {
            const scrollIntoView = vi.fn();
            const row = {scrollIntoView} as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findViewPipelineExecutionLink').mockReturnValue(null);
            vi.spyOn(domUtils, 'findLastStackedPipelineRow').mockReturnValue(row);

            await jumpToLastPipeline();

            expect(scrollIntoView).toHaveBeenCalledWith({block: 'start'});
            expect(Notifications.show).not.toHaveBeenCalled();
        });

        it('notifies when the page has no stacked pipeline rows', async () => {
            vi.spyOn(domUtils, 'findViewPipelineExecutionLink').mockReturnValue(null);
            vi.spyOn(domUtils, 'findLastStackedPipelineRow').mockReturnValue(null);

            await jumpToLastPipeline();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No stacked pipeline rows on this page',
            });
        });

        it('expands a selected child pipeline, then scrolls and toasts once it renders', async () => {
            const childId = '01KYWEXG59VW8KF897QNBXAWRX';
            const click = vi.fn(() => {
                // Like real Deck: the child execution renders after the click.
                const child = document.createElement('div');
                child.id = `execution-${childId}`;
                document.body.appendChild(child);
            });
            const link = {
                click,
                getAttribute: () =>
                    `#/applications/taskworker-service/executions/details/${childId}?stage=0&step=0`,
            } as unknown as HTMLAnchorElement;
            vi.spyOn(domUtils, 'findViewPipelineExecutionLink').mockReturnValue(link);
            vi.spyOn(domUtils, 'findChildPipelineName').mockReturnValue(
                'Deploy taskworker-service-data-tbl PRODUCTION',
            );
            const scrollIntoView = vi.fn();
            const row = {scrollIntoView} as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findLastStackedPipelineRow').mockReturnValue(row);

            await jumpToLastPipeline();

            expect(click).toHaveBeenCalled();
            expect(scrollIntoView).toHaveBeenCalledWith({block: 'start'});
            expect(Notifications.show).toHaveBeenNthCalledWith(1, {
                message: 'Expanding child pipeline: Deploy taskworker-service-data-tbl PRODUCTION',
            });
            expect(Notifications.show).toHaveBeenNthCalledWith(2, {
                message: 'Jumped to the last pipeline',
            });
        });

        it('does not scroll when the link href names no execution', async () => {
            const click = vi.fn();
            const link = {
                click,
                getAttribute: () => '#/applications/taskworker-service',
            } as unknown as HTMLAnchorElement;
            vi.spyOn(domUtils, 'findViewPipelineExecutionLink').mockReturnValue(link);
            vi.spyOn(domUtils, 'findChildPipelineName').mockReturnValue(null);
            const scrollIntoView = vi.fn();
            vi.spyOn(domUtils, 'findLastStackedPipelineRow').mockReturnValue({
                scrollIntoView,
            } as unknown as HTMLElement);

            await jumpToLastPipeline();

            expect(click).toHaveBeenCalled();
            expect(Notifications.show).toHaveBeenCalledExactlyOnceWith({
                message: 'Expanding child pipeline',
            });
            expect(scrollIntoView).not.toHaveBeenCalled();
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

    describe('climbToParentExecution', () => {
        const CHILD_URL =
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/web-service/executions/01KYWEXG47N131DFQ6W6C8EA30';
        const PARENT_HREF =
            '#/applications/hyperbase-deploy/executions/details/01KYWEVS4ZZBVD19RQ7ZH3NCCF?stage=0&step=0';

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        function stubCrumb() {
            const click = vi.fn();
            const crumb = {
                click,
                getAttribute: () => PARENT_HREF,
                textContent: 'K8s Meta Pipeline PRODUCTION',
            } as unknown as HTMLAnchorElement;
            vi.spyOn(domUtils, 'findParentBreadcrumbLink').mockReturnValue(crumb);
            return click;
        }

        it('climbs to the parent, opens the stage that ran the child, and scrolls', async () => {
            vi.stubGlobal('location', {href: CHILD_URL});
            const crumbClick = stubCrumb();
            vi.spyOn(domUtils, 'findPipelineNameForExecution').mockReturnValue(
                'Deploy sar-proxy PRODUCTION',
            );
            const labelClick = vi.fn();
            vi.spyOn(domUtils, 'findStageLabelForPipeline').mockReturnValue({
                click: labelClick,
                textContent: ' Run sar-proxy pipeline ',
            } as unknown as HTMLElement);
            const scrollIntoView = vi.fn();
            vi.spyOn(domUtils, 'findExecutionRow').mockReturnValue({
                scrollIntoView,
            } as unknown as HTMLElement);

            await climbToParentExecution();

            expect(domUtils.findParentBreadcrumbLink).toHaveBeenCalledWith(
                '01KYWEXG47N131DFQ6W6C8EA30',
            );
            expect(crumbClick).toHaveBeenCalled();
            expect(domUtils.findStageLabelForPipeline).toHaveBeenCalledWith(
                '01KYWEVS4ZZBVD19RQ7ZH3NCCF',
                'Deploy sar-proxy PRODUCTION',
            );
            expect(labelClick).toHaveBeenCalled();
            expect(scrollIntoView).toHaveBeenCalledWith({block: 'start'});
            expect(Notifications.show).toHaveBeenNthCalledWith(1, {
                message: 'Jumping to parent pipeline: K8s Meta Pipeline PRODUCTION',
            });
            expect(Notifications.show).toHaveBeenNthCalledWith(2, {
                message: 'Opened stage: Run sar-proxy pipeline',
            });
        });

        it('refuses when the execution has no breadcrumbs', async () => {
            vi.stubGlobal('location', {href: CHILD_URL});
            vi.spyOn(domUtils, 'findParentBreadcrumbLink').mockReturnValue(null);

            await climbToParentExecution();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No parent execution breadcrumbs on this page',
            });
        });

        it('gives up on the stage when no unique label matches', async () => {
            vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']});
            vi.stubGlobal('location', {href: CHILD_URL});
            const crumbClick = stubCrumb();
            vi.spyOn(domUtils, 'findPipelineNameForExecution').mockReturnValue(
                'Deploy sar-proxy PRODUCTION',
            );
            vi.spyOn(domUtils, 'findStageLabelForPipeline').mockReturnValue(null);
            const scrollIntoView = vi.fn();
            vi.spyOn(domUtils, 'findExecutionRow').mockReturnValue({
                scrollIntoView,
            } as unknown as HTMLElement);

            const pending = climbToParentExecution();
            await vi.advanceTimersByTimeAsync(6000);
            await pending;
            vi.useRealTimers();

            expect(crumbClick).toHaveBeenCalled();
            expect(scrollIntoView).not.toHaveBeenCalled();
            expect(Notifications.show).toHaveBeenNthCalledWith(2, {
                message: 'Could not find the stage that ran Deploy sar-proxy PRODUCTION',
            });
        });
    });

    describe('openMonitoringLinks', () => {
        const STACKED_URL =
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/web-service/executions/details/01KYWEXG47N131DFQ6W6C8EA30?stage=2&step=0';

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        const fakeLink = (click = vi.fn()) => ({click}) as unknown as HTMLAnchorElement;

        it('clicks links that are already on the page, without touching the stage', async () => {
            vi.stubGlobal('location', {href: STACKED_URL});
            const click = vi.fn();
            vi.spyOn(domUtils, 'findOpenSearchLinks').mockReturnValue([fakeLink(click)]);
            vi.spyOn(domUtils, 'findStageLabel');

            await openMonitoringLinks();

            expect(click).toHaveBeenCalled();
            expect(domUtils.findStageLabel).not.toHaveBeenCalled();
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Opened 1 OpenSearch link',
            });
        });

        it('opens the Monitoring Links stage and clicks the links once they render', async () => {
            vi.stubGlobal('location', {href: STACKED_URL});
            const linkClick = vi.fn();
            // Absent before the stage click, present once the pane renders.
            vi.spyOn(domUtils, 'findOpenSearchLinks')
                .mockReturnValueOnce([])
                .mockReturnValueOnce([])
                .mockReturnValue([fakeLink(linkClick), fakeLink(linkClick)]);
            const labelClick = vi.fn();
            vi.spyOn(domUtils, 'findStageLabel').mockReturnValue({
                click: labelClick,
            } as unknown as HTMLElement);

            await openMonitoringLinks();

            expect(domUtils.findStageLabel).toHaveBeenCalledWith(
                '01KYWEXG47N131DFQ6W6C8EA30',
                'Monitoring Links',
            );
            expect(labelClick).toHaveBeenCalled();
            expect(linkClick).toHaveBeenCalledTimes(2);
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Opened 2 OpenSearch links',
            });
        });

        it('gives up when the execution has no Monitoring Links stage', async () => {
            vi.stubGlobal('location', {href: STACKED_URL});
            vi.spyOn(domUtils, 'findOpenSearchLinks').mockReturnValue([]);
            vi.spyOn(domUtils, 'findStageLabel').mockReturnValue(null);

            await openMonitoringLinks();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No OpenSearch links found via the Monitoring Links stage',
            });
        });

        it('shows "No execution found" when the URL has no execution', async () => {
            vi.stubGlobal('location', {
                href: 'https://spinnaker.k8s.shadowbox.cloud/#/applications/web-service/executions',
            });

            await openMonitoringLinks();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No execution found in URL',
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
