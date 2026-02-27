import {describe, it, expect} from 'vitest';
import {isClouddevTermPage} from '@exo/exo-tabs/clouddev-term';

describe('isClouddevTermPage', () => {
    it('returns true for clouddev term URLs', () => {
        expect(
            isClouddevTermPage('https://ari-sweedler-devenv-term.clouddev.hyperbasedev.com/'),
        ).toBe(true);
    });

    it('returns true for other devenv term subdomains', () => {
        expect(
            isClouddevTermPage('https://some-other-devenv-term.clouddev.hyperbasedev.com/'),
        ).toBe(true);
    });

    it('returns false for non-term pages', () => {
        expect(isClouddevTermPage('https://github.com/owner/repo')).toBe(false);
    });

    it('returns false for lookalike domains', () => {
        expect(isClouddevTermPage('https://not-term.clouddev.hyperbasedev.com.evil.com/')).toBe(
            false,
        );
    });

    it('returns false for invalid URLs', () => {
        expect(isClouddevTermPage('not-a-url')).toBe(false);
    });
});
