import {describe, it, expect} from 'vitest';
import {isOpenSearchPage} from '../../src/library/opensearch';

describe('isOpenSearchPage', () => {
    it('returns true for production opensearch URL', () => {
        expect(
            isOpenSearchPage('https://opensearch-applogs.shadowbox.cloud/app/discover'),
        ).toBe(true);
    });

    it('returns true for staging opensearch URL', () => {
        expect(
            isOpenSearchPage(
                'https://opensearch-applogs.staging-shadowbox.cloud/app/discover',
            ),
        ).toBe(true);
    });

    it('returns true for alpha opensearch URL', () => {
        expect(
            isOpenSearchPage(
                'https://opensearch-applogs.alpha-shadowbox.cloud/app/discover',
            ),
        ).toBe(true);
    });

    it('returns false for non-opensearch URLs', () => {
        expect(isOpenSearchPage('https://github.com/owner/repo')).toBe(false);
    });

    it('returns false for similar but wrong domain', () => {
        expect(
            isOpenSearchPage('https://opensearch.shadowbox.cloud/app/discover'),
        ).toBe(false);
    });
});
