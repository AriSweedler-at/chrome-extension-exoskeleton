import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {SpinnakerContent} from '@exo/exo-tabs/spinnaker/SpinnakerComponent';
import * as actions from '@exo/exo-tabs/spinnaker/actions';

// Mock the action functions
vi.mock('./actions', () => ({
    toggleExecution: vi.fn(),
    isolatePipeline: vi.fn(),
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
            expect(screen.getByText('Isolate Pipeline')).toBeInTheDocument();
        });

        it('should render keyboard shortcut hints', () => {
            render(<SpinnakerContent />);

            expect(screen.getByText('e')).toBeInTheDocument();
            expect(screen.getByText('i')).toBeInTheDocument();
        });
    });

    describe('button actions', () => {
        it('should call toggleExecution when Toggle button clicked', () => {
            render(<SpinnakerContent />);
            const button = screen.getByText('Toggle Execution Details');

            fireEvent.click(button);

            expect(actions.toggleExecution).toHaveBeenCalledTimes(1);
        });

        it('should call isolatePipeline when Isolate button clicked', () => {
            render(<SpinnakerContent />);
            const button = screen.getByText('Isolate Pipeline');

            fireEvent.click(button);

            expect(actions.isolatePipeline).toHaveBeenCalledTimes(1);
        });
    });
});
