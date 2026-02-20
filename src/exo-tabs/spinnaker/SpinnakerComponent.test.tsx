import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {SpinnakerContent} from '@exo/exo-tabs/spinnaker/SpinnakerComponent';
import * as actions from '@exo/exo-tabs/spinnaker/actions';

// Mock the action functions
vi.mock('./actions', () => ({
    toggleExecution: vi.fn(),
    displayActiveExecution: vi.fn(),
    displayActiveStage: vi.fn(),
    jumpToExecution: vi.fn(),
    extractPodNames: vi.fn(() => Promise.resolve()),
}));

describe('SpinnakerComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render section title', () => {
            render(<SpinnakerContent />);
            expect(screen.getByText('Execution Controls')).toBeInTheDocument();
        });

        it('should render all action buttons', () => {
            render(<SpinnakerContent />);

            expect(screen.getByText('Toggle Execution Details')).toBeInTheDocument();
            expect(screen.getByText('Show Active Execution')).toBeInTheDocument();
            expect(screen.getByText('Show Active Stage')).toBeInTheDocument();
            expect(screen.getByText('Jump to Execution')).toBeInTheDocument();
            expect(screen.getByText('Extract Pod Names')).toBeInTheDocument();
        });

        it('should render keyboard shortcut hints', () => {
            render(<SpinnakerContent />);

            expect(screen.getByText('e')).toBeInTheDocument();
            expect(screen.getByText('x')).toBeInTheDocument();
            expect(screen.getByText('s')).toBeInTheDocument();
            expect(screen.getByText('j')).toBeInTheDocument();
            expect(screen.getByText('p')).toBeInTheDocument();
        });
    });

    describe('button actions', () => {
        it('should call toggleExecution when Toggle button clicked', () => {
            render(<SpinnakerContent />);
            const button = screen.getByText('Toggle Execution Details');

            fireEvent.click(button);

            expect(actions.toggleExecution).toHaveBeenCalledTimes(1);
        });

        it('should call displayActiveExecution when Show Execution button clicked', () => {
            render(<SpinnakerContent />);
            const button = screen.getByText('Show Active Execution');

            fireEvent.click(button);

            expect(actions.displayActiveExecution).toHaveBeenCalledTimes(1);
        });

        it('should call displayActiveStage when Show Stage button clicked', () => {
            render(<SpinnakerContent />);
            const button = screen.getByText('Show Active Stage');

            fireEvent.click(button);

            expect(actions.displayActiveStage).toHaveBeenCalledTimes(1);
        });

        it('should call jumpToExecution when Jump button clicked', () => {
            render(<SpinnakerContent />);
            const button = screen.getByText('Jump to Execution');

            fireEvent.click(button);

            expect(actions.jumpToExecution).toHaveBeenCalledTimes(1);
        });

        it('should call extractPodNames when Extract button clicked', async () => {
            render(<SpinnakerContent />);
            const button = screen.getByText('Extract Pod Names');

            fireEvent.click(button);

            expect(actions.extractPodNames).toHaveBeenCalledTimes(1);
        });
    });

    describe('keyboard shortcuts', () => {
        it('should call toggleExecution when "e" key pressed', () => {
            render(<SpinnakerContent />);

            fireEvent.keyDown(document, {key: 'e'});

            expect(actions.toggleExecution).toHaveBeenCalledTimes(1);
        });

        it('should call displayActiveExecution when "x" key pressed', () => {
            render(<SpinnakerContent />);

            fireEvent.keyDown(document, {key: 'x'});

            expect(actions.displayActiveExecution).toHaveBeenCalledTimes(1);
        });

        it('should call displayActiveStage when "s" key pressed', () => {
            render(<SpinnakerContent />);

            fireEvent.keyDown(document, {key: 's'});

            expect(actions.displayActiveStage).toHaveBeenCalledTimes(1);
        });

        it('should call jumpToExecution when "j" key pressed', () => {
            render(<SpinnakerContent />);

            fireEvent.keyDown(document, {key: 'j'});

            expect(actions.jumpToExecution).toHaveBeenCalledTimes(1);
        });

        it('should call extractPodNames when "p" key pressed', () => {
            render(<SpinnakerContent />);

            fireEvent.keyDown(document, {key: 'p'});

            expect(actions.extractPodNames).toHaveBeenCalledTimes(1);
        });

        it('should not trigger shortcuts when typing in input', () => {
            render(
                <div>
                    <input type="text" data-testid="test-input" />
                    <SpinnakerContent />
                </div>,
            );

            const input = screen.getByTestId('test-input');
            input.focus();

            fireEvent.keyDown(input, {key: 'e'});

            expect(actions.toggleExecution).not.toHaveBeenCalled();
        });

        it('should not trigger shortcuts when typing in textarea', () => {
            render(
                <div>
                    <textarea data-testid="test-textarea" />
                    <SpinnakerContent />
                </div>,
            );

            const textarea = screen.getByTestId('test-textarea');
            textarea.focus();

            fireEvent.keyDown(textarea, {key: 's'});

            expect(actions.displayActiveStage).not.toHaveBeenCalled();
        });

        it('should handle uppercase keys', () => {
            render(<SpinnakerContent />);

            fireEvent.keyDown(document, {key: 'E'});

            expect(actions.toggleExecution).toHaveBeenCalledTimes(1);
        });

        it('should ignore unregistered keys', () => {
            render(<SpinnakerContent />);

            fireEvent.keyDown(document, {key: 'z'});

            expect(actions.toggleExecution).not.toHaveBeenCalled();
            expect(actions.displayActiveExecution).not.toHaveBeenCalled();
            expect(actions.displayActiveStage).not.toHaveBeenCalled();
            expect(actions.jumpToExecution).not.toHaveBeenCalled();
            expect(actions.extractPodNames).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should remove event listener on unmount', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
            const {unmount} = render(<SpinnakerContent />);

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });
});
