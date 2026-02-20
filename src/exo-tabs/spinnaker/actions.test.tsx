import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
    toggleExecution,
    displayActiveExecution,
    displayActiveStage,
    jumpToExecution,
    extractPodNames,
} from '@exo/exo-tabs/spinnaker/actions';
import * as domUtils from '@exo/exo-tabs/spinnaker/dom-utils';
import * as podExtractor from '@exo/exo-tabs/spinnaker/pod-extractor';

// Mock chrome.notifications and runtime APIs
(globalThis as Record<string, unknown>).chrome = {
    notifications: {
        create: vi.fn((_id: string, _options: unknown, callback?: (id: string) => void) => {
            if (callback) callback('notification-id');
        }),
    },
    runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
    },
};

// Mock navigator.clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
    },
});

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
            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'Toggled execution details',
                }),
                expect.any(Function),
            );
        });

        it('should show error notification when link not found', () => {
            vi.spyOn(domUtils, 'findExecutionDetailsLink').mockReturnValue(null);

            toggleExecution();

            expect(domUtils.findExecutionDetailsLink).toHaveBeenCalled();
            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'Execution details link not found',
                }),
                expect.any(Function),
            );
        });
    });

    describe('displayActiveExecution', () => {
        it('should display execution ID and open status', () => {
            vi.spyOn(domUtils, 'getExecutionIdFromUrl').mockReturnValue(
                '01HPN64GE091GK831P0XG2JQQT',
            );
            vi.spyOn(domUtils, 'isExecutionOpen').mockReturnValue(true);

            displayActiveExecution();

            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'Execution: 01HPN64GE091GK831P0XG2JQQT (open)',
                }),
                expect.any(Function),
            );
        });

        it('should display execution ID and closed status', () => {
            vi.spyOn(domUtils, 'getExecutionIdFromUrl').mockReturnValue(
                '01HPN64GE091GK831P0XG2JQQT',
            );
            vi.spyOn(domUtils, 'isExecutionOpen').mockReturnValue(false);

            displayActiveExecution();

            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'Execution: 01HPN64GE091GK831P0XG2JQQT (closed)',
                }),
                expect.any(Function),
            );
        });

        it('should show "No execution found" when no execution ID', () => {
            vi.spyOn(domUtils, 'getExecutionIdFromUrl').mockReturnValue(null);
            vi.spyOn(domUtils, 'isExecutionOpen').mockReturnValue(false);

            displayActiveExecution();

            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'No execution found in URL',
                }),
                expect.any(Function),
            );
        });
    });

    describe('displayActiveStage', () => {
        it('should display stage information when found', () => {
            vi.spyOn(domUtils, 'getActiveStageFromUrl').mockReturnValue({
                stage: 2,
                step: 0,
                details: 'runJobConfig',
            });

            displayActiveStage();

            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'Stage 2: runJobConfig',
                }),
                expect.any(Function),
            );
        });

        it('should show "No stage open" when no stage found', () => {
            vi.spyOn(domUtils, 'getActiveStageFromUrl').mockReturnValue(null);

            displayActiveStage();

            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'No stage open',
                }),
                expect.any(Function),
            );
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
            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'Toggled execution details',
                }),
                expect.any(Function),
            );
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
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-pod-123');
            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'Copied pod name: test-pod-123',
                }),
                expect.any(Function),
            );
        });

        it('should show count when multiple pod names found', async () => {
            const mockErrorContainer = {
                innerHTML: 'multiple pods',
            } as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findErrorContainer').mockReturnValue(mockErrorContainer);
            vi.spyOn(podExtractor, 'extractPodNames').mockReturnValue(['pod-1', 'pod-2', 'pod-3']);

            await extractPodNames();

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pod-1');
            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'Copied pod name: pod-1 (3 total found)',
                }),
                expect.any(Function),
            );
        });

        it('should show error when no pod names found', async () => {
            const mockErrorContainer = {
                innerHTML: 'error without pod names',
            } as unknown as HTMLElement;
            vi.spyOn(domUtils, 'findErrorContainer').mockReturnValue(mockErrorContainer);
            vi.spyOn(podExtractor, 'extractPodNames').mockReturnValue([]);

            await extractPodNames();

            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'No pod names found in error',
                }),
                expect.any(Function),
            );
        });

        it('should show error when no error container found', async () => {
            vi.spyOn(domUtils, 'findErrorContainer').mockReturnValue(null);

            await extractPodNames();

            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(chrome.notifications.create).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    type: 'basic',
                    title: 'Spinnaker',
                    message: 'No error container found',
                }),
                expect.any(Function),
            );
        });
    });
});
