import {describe, it, expect} from 'vitest';
import {isSpinnakerSearchPage} from '../../src/library/spinnaker';

describe('isSpinnakerSearchPage', () => {
    it('returns true for spinnaker.k8s.shadowbox.cloud search page', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/search')).toBe(true);
    });

    it('returns true for spinnaker.k8s.alpha-shadowbox.cloud search page', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.alpha-shadowbox.cloud/#/search')).toBe(true);
    });

    it('returns true for search page with query params', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/search?q=test')).toBe(true);
    });

    it('returns false for non-search Spinnaker pages', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/applications')).toBe(false);
    });

    it('returns false for non-Spinnaker URLs', () => {
        expect(isSpinnakerSearchPage('https://github.com/owner/repo')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
        expect(isSpinnakerSearchPage('not-a-url')).toBe(false);
    });
});
