import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
    toggleExecution,
    isolatePipeline,
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

    describe('isolatePipeline', () => {
        const EXECUTION_URL =
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN5GWDEJ5088Y9QZ4JPG2C0?stage=2&step=0&details=runJobConfig';

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('should navigate to the pipeline-filtered URL and notify', () => {
            vi.stubGlobal('location', {href: EXECUTION_URL});
            vi.spyOn(domUtils, 'findPipelineNameForExecution').mockReturnValue(
                'Blue Green Provisioning PRODUCTION',
            );

            isolatePipeline();

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

        it('should show "No execution found" when the URL has no execution', () => {
            vi.stubGlobal('location', {
                href: 'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions',
            });

            isolatePipeline();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No execution found in URL',
            });
        });

        it('should show an error when the pipeline name cannot be found', () => {
            vi.stubGlobal('location', {href: EXECUTION_URL});
            vi.spyOn(domUtils, 'findPipelineNameForExecution').mockReturnValue(null);

            isolatePipeline();

            expect(window.location.href).toBe(EXECUTION_URL);
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Could not determine the pipeline for this execution',
            });
        });
    });
});
