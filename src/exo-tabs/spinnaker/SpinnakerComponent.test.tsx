import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {SpinnakerContent} from '@exo/exo-tabs/spinnaker/SpinnakerComponent';
import {SpinnakerRunAction} from '@exo/exo-tabs/spinnaker/action';
import chrome from 'sinon-chrome';

describe('SpinnakerComponent', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        chrome.reset();
        chrome.tabs.query.returns(
            Promise.resolve([{id: 42, url: 'https://spinnaker.k8s.shadowbox.cloud/'}]),
        );
    });

    describe('rendering', () => {
        it('should render section title', () => {
            render(<SpinnakerContent />);
            expect(screen.getByText('Execution Controls')).toBeInTheDocument();
        });

        it('should render all action buttons', () => {
            render(<SpinnakerContent />);

            expect(screen.getByText('Toggle Execution Details')).toBeInTheDocument();
            expect(screen.getByText('Isolate Pipeline')).toBeInTheDocument();
        });

        it('should render keyboard shortcut hints', () => {
            render(<SpinnakerContent />);

            expect(screen.getByText('e')).toBeInTheDocument();
            expect(screen.getByText('i')).toBeInTheDocument();
        });
    });

    describe('button actions', () => {
        it('sends the toggle action to the page when Toggle button clicked', async () => {
            const sendToTab = vi
                .spyOn(SpinnakerRunAction, 'sendToTab')
                .mockResolvedValue(undefined);
            render(<SpinnakerContent />);

            fireEvent.click(screen.getByText('Toggle Execution Details'));

            await waitFor(() => {
                expect(sendToTab).toHaveBeenCalledWith(42, {action: 'toggleExecution'});
            });
        });

        it('sends the isolate action to the page when Isolate button clicked', async () => {
            const sendToTab = vi
                .spyOn(SpinnakerRunAction, 'sendToTab')
                .mockResolvedValue(undefined);
            render(<SpinnakerContent />);

            fireEvent.click(screen.getByText('Isolate Pipeline'));

            await waitFor(() => {
                expect(sendToTab).toHaveBeenCalledWith(42, {action: 'isolatePipeline'});
            });
        });

        it('surfaces an error when no content script answers', async () => {
            vi.spyOn(SpinnakerRunAction, 'sendToTab').mockRejectedValue(
                new Error('Could not establish connection'),
            );
            render(<SpinnakerContent />);

            fireEvent.click(screen.getByText('Isolate Pipeline'));

            await waitFor(() => {
                expect(screen.getByTestId('error-message')).toHaveTextContent(
                    'Could not establish connection',
                );
            });
        });
    });
});
