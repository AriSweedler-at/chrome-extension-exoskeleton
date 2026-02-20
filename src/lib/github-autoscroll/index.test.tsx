import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {isGitHubPRChangesPage, initializeAutoScroll} from '@exo/lib/github-autoscroll';

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

    describe('core autoscroll behavior', () => {
        beforeEach(() => {
            // Setup DOM with multiple files
            document.body.innerHTML = `
                <div data-hpc="true">
                    <div class="d-flex flex-column gap-3">
                        <div class="Diff-module__diffHeaderWrapper--abc123">
                            <div id="file1" class="Diff-module__fileName--xyz">
                                <div class="Diff-module__fileName--xyz">file1.ts</div>
                                <button aria-pressed="false">Viewed</button>
                            </div>
                        </div>
                        <div class="Diff-module__diffHeaderWrapper--abc123">
                            <div id="file2" class="Diff-module__fileName--xyz">
                                <div class="Diff-module__fileName--xyz">file2.ts</div>
                                <button aria-pressed="false">Viewed</button>
                            </div>
                        </div>
                        <div class="Diff-module__diffHeaderWrapper--abc123">
                            <div id="file3" class="Diff-module__fileName--xyz">
                                <div class="Diff-module__fileName--xyz">file3.ts</div>
                                <button aria-pressed="false">Viewed</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        it('scrolls to next unviewed file when clicking Viewed button', async () => {
            const stopFn = initializeAutoScroll();
            expect(stopFn).not.toBeNull();

            // Spy on window.scrollBy after initialization to track only the button click scroll
            const scrollSpy = vi.spyOn(window, 'scrollBy');

            // Get first file's button
            const file1 = document.getElementById('file1') as HTMLElement;
            const button1 = file1.querySelector('button') as HTMLButtonElement;

            // Click the button, then update aria-pressed (simulating GitHub's async update)
            button1.click();
            await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay before setting
            button1.setAttribute('aria-pressed', 'true');

            // Wait for the setTimeout in onButtonClick to execute (100ms total + buffer)
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Verify window.scrollBy was called (scrolling happened)
            expect(scrollSpy).toHaveBeenCalled();

            scrollSpy.mockRestore();
            stopFn!();
        });

        it('applies flash animation to next file', async () => {
            const stopFn = initializeAutoScroll();

            const file2 = document.getElementById('file2') as HTMLElement;
            const file1 = document.getElementById('file1') as HTMLElement;
            const button1 = file1.querySelector('button') as HTMLButtonElement;

            button1.setAttribute('aria-pressed', 'true');
            button1.click();

            await new Promise((resolve) => setTimeout(resolve, 150));

            // Check that flash class was added to file2
            expect(file2.classList.contains('gh-autoscroll-flash')).toBe(true);

            // Wait for flash to be removed (1500ms + buffer)
            await new Promise((resolve) => setTimeout(resolve, 1600));
            expect(file2.classList.contains('gh-autoscroll-flash')).toBe(false);

            stopFn();
        });

        it('does nothing when all files are viewed', async () => {
            const stopFn = initializeAutoScroll();

            // Mark all files as viewed
            const buttons = document.querySelectorAll('button[aria-pressed]');
            buttons.forEach((btn) => btn.setAttribute('aria-pressed', 'true'));

            const file3 = document.getElementById('file3') as HTMLElement;
            const scrollSpy = vi.fn();
            file3.scrollIntoView = scrollSpy;

            const button3 = file3.querySelector('button') as HTMLButtonElement;
            button3.click();

            await new Promise((resolve) => setTimeout(resolve, 150));

            // Should not scroll when no unviewed files remain
            expect(scrollSpy).not.toHaveBeenCalled();

            stopFn();
        });

        it('skips viewed files and scrolls to next unviewed', async () => {
            const stopFn = initializeAutoScroll();

            // Mark file2 as viewed
            const file2 = document.getElementById('file2') as HTMLElement;
            const button2 = file2.querySelector('button') as HTMLButtonElement;
            button2.setAttribute('aria-pressed', 'true');

            // Spy on window.scrollBy
            const scrollSpy = vi.spyOn(window, 'scrollBy');

            // Click file1's button
            const file1 = document.getElementById('file1') as HTMLElement;
            const button1 = file1.querySelector('button') as HTMLButtonElement;
            button1.setAttribute('aria-pressed', 'true');
            button1.click();

            await new Promise((resolve) => setTimeout(resolve, 150));

            // Should scroll to file3, skipping already-viewed file2
            expect(scrollSpy).toHaveBeenCalled();

            scrollSpy.mockRestore();
            stopFn();
        });
    });
});
