import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
    toggleExecution,
    displayActiveExecution,
    isolatePipeline,
    jumpToExecution,
    extractPodNames,
} from '@exo/exo-tabs/spinnaker/actions';
import * as domUtils from '@exo/exo-tabs/spinnaker/dom-utils';
import * as podExtractor from '@exo/exo-tabs/spinnaker/pod-extractor';
import {Clipboard} from '@exo/lib/clipboard';
import {Notifications} from '@exo/lib/toast-notification';

vi.mock('@exo/lib/toast-notification', () => ({
    Notifications: {show: vi.fn()},
}));

vi.mock('@exo/lib/clipboard', () => ({
    Clipboard: {write: vi.fn(() => Promise.resolve())},
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

    describe('displayActiveExecution', () => {
        it('should display execution ID and open status', () => {
            vi.spyOn(domUtils, 'getExecutionIdFromUrl').mockReturnValue(
                '01HPN64GE091GK831P0XG2JQQT',
            );
            vi.spyOn(domUtils, 'isExecutionOpen').mockReturnValue(true);

            displayActiveExecution();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Execution: 01HPN64GE091GK831P0XG2JQQT (open)',
            });
        });

        it('should display execution ID and closed status', () => {
            vi.spyOn(domUtils, 'getExecutionIdFromUrl').mockReturnValue(
                '01HPN64GE091GK831P0XG2JQQT',
            );
            vi.spyOn(domUtils, 'isExecutionOpen').mockReturnValue(false);

            displayActiveExecution();

            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Execution: 01HPN64GE091GK831P0XG2JQQT (closed)',
            });
        });

        it('should show "No execution found" when no execution ID', () => {
            vi.spyOn(domUtils, 'getExecutionIdFromUrl').mockReturnValue(null);
            vi.spyOn(domUtils, 'isExecutionOpen').mockReturnValue(false);

            displayActiveExecution();

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

    describe('jumpToExecution', () => {
        it('should be an alias for toggleExecution', () => {
            const clickFn = vi.fn();
            const mockLink = {click: clickFn} as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findExecutionDetailsLink').mockReturnValue(mockLink);

            jumpToExecution();

            expect(domUtils.findExecutionDetailsLink).toHaveBeenCalled();
            expect(clickFn).toHaveBeenCalled();
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Toggled execution details',
            });
        });
    });

    describe('extractPodNames', () => {
        it('should extract pod names and copy first to clipboard', async () => {
            const mockErrorContainer = {
                innerHTML: '{"metadata":{"name":"test-pod-123"}}',
            } as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findErrorContainer').mockReturnValue(mockErrorContainer);
            vi.spyOn(podExtractor, 'extractPodNames').mockReturnValue(['test-pod-123']);

            await extractPodNames();

            expect(domUtils.findErrorContainer).toHaveBeenCalled();
            expect(podExtractor.extractPodNames).toHaveBeenCalledWith(
                '{"metadata":{"name":"test-pod-123"}}',
            );
            expect(Clipboard.write).toHaveBeenCalledWith('test-pod-123');
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Copied pod name: test-pod-123',
            });
        });

        it('should show count when multiple pod names found', async () => {
            const mockErrorContainer = {
                innerHTML: 'multiple pods',
            } as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findErrorContainer').mockReturnValue(mockErrorContainer);
            vi.spyOn(podExtractor, 'extractPodNames').mockReturnValue(['pod-1', 'pod-2', 'pod-3']);

            await extractPodNames();

            expect(Clipboard.write).toHaveBeenCalledWith('pod-1');
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'Copied pod name: pod-1 (3 total found)',
            });
        });

        it('should show error when no pod names found', async () => {
            const mockErrorContainer = {
                innerHTML: 'error without pod names',
            } as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findErrorContainer').mockReturnValue(mockErrorContainer);
            vi.spyOn(podExtractor, 'extractPodNames').mockReturnValue([]);

            await extractPodNames();

            expect(Clipboard.write).not.toHaveBeenCalled();
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No pod names found in error',
            });
        });

        it('should show error when no error container found', async () => {
            vi.spyOn(domUtils, 'findErrorContainer').mockReturnValue(null);

            await extractPodNames();

            expect(Clipboard.write).not.toHaveBeenCalled();
            expect(Notifications.show).toHaveBeenCalledWith({
                message: 'No error container found',
            });
        });
    });
});
