import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {isGitHubPRChangesPage, initializeAutoScroll} from '../../src/library/github-autoscroll';

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

describe('initializeAutoScroll', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div data-hpc="true">
                <div class="d-flex flex-column gap-3">
                    <div class="Diff-module__diffHeaderWrapper--abc123">
                        <button aria-pressed="false">Viewed</button>
                    </div>
                    <div class="Diff-module__diffHeaderWrapper--abc123">
                        <button aria-pressed="true">Viewed</button>
                    </div>
                </div>
            </div>
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__ghAutoScrollStop;
        // Clean up any leftover style elements
        const style = document.getElementById('gh-autoscroll-styles');
        if (style) {
            style.remove();
        }
    });

    it('returns a stop function', () => {
        const stopFn = initializeAutoScroll();
        expect(typeof stopFn).toBe('function');
        stopFn();
    });

    it('injects CSS styles', () => {
        initializeAutoScroll();
        const style = document.getElementById('gh-autoscroll-styles');
        expect(style).not.toBeNull();
        expect(style?.textContent).toContain('gh-autoscroll-flash');
    });

    it('stores stop function in window', () => {
        const stopFn = initializeAutoScroll();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((window as any).__ghAutoScrollStop).toBe(stopFn);
        stopFn();
    });

    it('removes CSS when stopped', () => {
        const stopFn = initializeAutoScroll();
        stopFn();
        const style = document.getElementById('gh-autoscroll-styles');
        expect(style).toBeNull();
    });
});
