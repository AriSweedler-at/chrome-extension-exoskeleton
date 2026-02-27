import {describe, it, expect} from 'vitest';
import {isSpinnakerPage, isSpinnakerSearchPage} from '@exo/exo-tabs/spinnaker/url-match';

describe('isSpinnakerPage', () => {
    it('returns true for shadowbox Spinnaker', () => {
        expect(
            isSpinnakerPage('https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions'),
        ).toBe(true);
    });

    it('returns true for alpha-shadowbox Spinnaker', () => {
        expect(
            isSpinnakerPage(
                'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/app/executions',
            ),
        ).toBe(true);
    });

    it('returns false for non-Spinnaker URLs', () => {
        expect(isSpinnakerPage('https://github.com/owner/repo')).toBe(false);
    });

    it('returns false for URLs containing spinnaker as substring', () => {
        expect(isSpinnakerPage('https://docs.google.com/d/spinnaker-notes')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
        expect(isSpinnakerPage('not-a-url')).toBe(false);
    });
});

describe('isSpinnakerSearchPage', () => {
    it('returns true for spinnaker.k8s.shadowbox.cloud search page', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/search')).toBe(true);
    });

    it('returns true for spinnaker.k8s.alpha-shadowbox.cloud search page', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.alpha-shadowbox.cloud/#/search')).toBe(
            true,
        );
    });

    it('returns true for search page with query params', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/search?q=test')).toBe(
            true,
        );
    });

    it('returns false for non-search Spinnaker pages', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/applications')).toBe(
            false,
        );
    });

    it('returns false for non-Spinnaker URLs', () => {
        expect(isSpinnakerSearchPage('https://github.com/owner/repo')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
        expect(isSpinnakerSearchPage('not-a-url')).toBe(false);
    });
});
