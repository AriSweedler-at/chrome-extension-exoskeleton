import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {SpinnakerContent} from '../../src/components/SpinnakerComponent';

describe('SpinnakerContent', () => {
    it('renders placeholder message', () => {
        render(<SpinnakerContent />);
        expect(screen.getByText('Spinnaker')).toBeInTheDocument();
        expect(screen.getByText('Spinnaker search functionality coming soon.')).toBeInTheDocument();
    });
});
