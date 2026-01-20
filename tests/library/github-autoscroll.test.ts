import {describe, it, expect} from 'vitest';
import {isGitHubPRChangesPage} from '../../src/library/github-autoscroll';

describe('isGitHubPRChangesPage', () => {
    it('returns true for valid GitHub PR changes URL', () => {
        const url = 'https://github.com/owner/repo/pull/123/changes';
        expect(isGitHubPRChangesPage(url)).toBe(true);
    });

    it('returns false for GitHub PR files URL', () => {
        const url = 'https://github.com/owner/repo/pull/123/files';
        expect(isGitHubPRChangesPage(url)).toBe(false);
    });

    it('returns false for non-PR GitHub URL', () => {
        const url = 'https://github.com/owner/repo';
        expect(isGitHubPRChangesPage(url)).toBe(false);
    });

    it('returns false for non-GitHub URL', () => {
        const url = 'https://gitlab.com/owner/repo/merge_requests/123';
        expect(isGitHubPRChangesPage(url)).toBe(false);
    });

    it('returns true for URL with query parameters', () => {
        const url = 'https://github.com/owner/repo/pull/123/changes?w=1';
        expect(isGitHubPRChangesPage(url)).toBe(true);
    });

    it('returns true for URL with hash fragment', () => {
        const url = 'https://github.com/owner/repo/pull/123/changes#diff-abc123';
        expect(isGitHubPRChangesPage(url)).toBe(true);
    });

    it('returns false for URL with invalid PR number (non-numeric)', () => {
        const url = 'https://github.com/owner/repo/pull/abc/changes';
        expect(isGitHubPRChangesPage(url)).toBe(false);
    });

    it('returns true for URL with www subdomain', () => {
        const url = 'https://www.github.com/owner/repo/pull/123/changes';
        expect(isGitHubPRChangesPage(url)).toBe(true);
    });
});
