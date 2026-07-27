import {scrollElementTop} from '@exo/exo-tabs/github-autoscroll/scroll';
import {theme} from '@exo/theme/default';

interface GitHubPR {
    owner: string;
    repo: string;
    prNumber: string;
    tab: string | undefined; // sub-tab after the PR number, e.g. 'changes', 'commits'
}

/**
 * Check if URL is on the GitHub host (support both github.com and www.github.com)
 */
export function isGitHubHost(url: string): boolean {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return hostname === 'github.com' || hostname === 'www.github.com';
    } catch {
        // Invalid URL
        return false;
    }
}

/**
 * Parse a GitHub pull request URL into its owner/repo/number/tab parts.
 * Returns null if the URL is not a GitHub pull request page.
 */
function parseGitHubPRUrl(url: string): GitHubPR | null {
    if (!isGitHubHost(url)) {
        return null;
    }
    try {
        const urlObj = new URL(url);

        // Parse pathname (ignoring query params and fragments)
        // Expected format: owner/repo/pull/{number}[/tab]
        const pathParts = urlObj.pathname.split('/').filter((part) => part !== '');
        if (pathParts.length < 4 || pathParts[2] !== 'pull' || !/^\d+$/.test(pathParts[3])) {
            return null;
        }

        return {owner: pathParts[0], repo: pathParts[1], prNumber: pathParts[3], tab: pathParts[4]};
    } catch {
        // Invalid URL
        return null;
    }
}

/**
 * Check if URL is any GitHub pull request page (any tab, including the PR root)
 */
export function isGitHubPRPage(url: string): boolean {
    return parseGitHubPRUrl(url) !== null;
}

/**
 * Check if URL is a GitHub PR changes page
 */
export function isGitHubPRChangesPage(url: string): boolean {
    return parseGitHubPRUrl(url)?.tab === 'changes';
}

/**
 * Navigate to a tab of the current GitHub PR. The Conversation tab is the PR
 * root, so pass '' for it; other tabs ('changes', 'commits', 'checks') are the
 * path suffix. No-op when not on a PR page or already on the target tab.
 */
function navigateToPRTab(targetTab: '' | 'changes'): void {
    const pr = parseGitHubPRUrl(window.location.href);
    if (!pr || (pr.tab ?? '') === targetTab) {
        return;
    }
    const base = `/${pr.owner}/${pr.repo}/pull/${pr.prNumber}`;
    window.location.href = targetTab ? `${base}/${targetTab}` : base;
}

/**
 * Navigate to the "Conversation" tab (PR root) of the current GitHub PR.
 */
export function goToConversation(): void {
    navigateToPRTab('');
}

/**
 * Navigate to the "Files changed" (changes) tab of the current GitHub PR.
 */
export function goToChangedFiles(): void {
    navigateToPRTab('changes');
}

/**
 * Get all file elements in the PR changes view
 */
function getFiles(): HTMLElement[] {
    // New GitHub UI: Look for DiffFileHeader-module__diff-file-header class (current 2025+ design)
    const diffFileHeaders = Array.from(
        document.querySelectorAll('[class*="DiffFileHeader-module__diff-file-header__"]'),
    );
    if (diffFileHeaders.length > 0) {
        return diffFileHeaders as HTMLElement[];
    }

    // Look for GitHub's CSS module classes with dynamic suffixes
    // Target: class starting with 'Diff-module__diffHeaderWrapper--'
    const container = document.querySelector('[data-hpc="true"] .d-flex.flex-column.gap-3');

    if (container) {
        const diffHeaderWrappers = Array.from(
            container.querySelectorAll('[class*="Diff-module__diffHeaderWrapper--"]'),
        );
        if (diffHeaderWrappers.length > 0) {
            // Extract the actual file header (first child) from each wrapper
            return diffHeaderWrappers
                .map((wrapper) => wrapper.firstElementChild as HTMLElement)
                .filter((el) => el !== null);
        }
    }

    // Fallback: search globally for the diff header wrapper pattern
    const globalDiffHeaderWrappers = Array.from(
        document.querySelectorAll('[class*="Diff-module__diffHeaderWrapper--"]'),
    );
    if (globalDiffHeaderWrappers.length > 0) {
        // Extract the actual file header (first child) from each wrapper
        return globalDiffHeaderWrappers
            .map((wrapper) => wrapper.firstElementChild as HTMLElement)
            .filter((el) => el !== null);
    }

    // Final fallback selectors
    const fallbackSelectors = [
        '[data-tagsearch-path]',
        '[data-path]',
        '.file-header',
        '.file',
        '.js-file',
    ];

    for (const selector of fallbackSelectors) {
        const files = Array.from(document.querySelectorAll(selector));
        if (files.length > 0) {
            // Filter out UI control elements that aren't actual files
            const filtered = files.filter((el) => {
                const testId = el.getAttribute('data-testid');
                // Exclude file tree buttons and controls
                if (
                    testId &&
                    (testId.includes('expand-file-tree') ||
                        testId.includes('collapse-file-tree') ||
                        testId.includes('file-controls-divider'))
                ) {
                    return false;
                }
                return true;
            });
            if (filtered.length > 0) {
                return filtered as HTMLElement[];
            }
        }
    }

    return [];
}

/**
 * Check if a file is marked as viewed
 */
function isViewed(fileElement: HTMLElement): boolean {
    // Look for GitHub's new button-based "viewed" system
    const viewedButton =
        fileElement.querySelector('button[aria-pressed="true"]') ||
        fileElement.closest('div')?.querySelector('button[aria-pressed="true"]') ||
        fileElement.parentElement?.querySelector('button[aria-pressed="true"]');

    if (viewedButton && viewedButton.textContent?.includes('Viewed')) {
        return true;
    }

    // Check for the CSS class pattern that indicates viewed state
    const viewedByClass =
        fileElement.querySelector('[class*="MarkAsViewedButton-module__viewed--"]') ||
        fileElement
            .closest('div')
            ?.querySelector('[class*="MarkAsViewedButton-module__viewed--"]') ||
        fileElement.parentElement?.querySelector('[class*="MarkAsViewedButton-module__viewed--"]');

    if (viewedByClass) return true;

    // Fallback to old checkbox system (if still exists)
    const checkboxSelectors = [
        'input[type="checkbox"][name="viewed"]',
        'input.js-reviewed-checkbox',
        'input[type="checkbox"]',
    ];

    for (const selector of checkboxSelectors) {
        const cb =
            fileElement.querySelector(selector) ||
            fileElement.closest('div')?.querySelector(selector) ||
            fileElement.parentElement?.querySelector(selector);
        if (cb && (cb as HTMLInputElement).checked) return true;
    }
    return false;
}

/**
 * Find the next unviewed file after the given element
 */
function findNextUnviewedAfter(currentFile: HTMLElement | null): HTMLElement | null {
    const files = getFiles();

    if (files.length === 0) {
        return null;
    }

    // If no current file, return first unviewed
    if (!currentFile) {
        return files.find((file) => !isViewed(file)) || null;
    }

    // Find index of current file
    const currentIndex = files.indexOf(currentFile);
    if (currentIndex === -1) {
        return files.find((file) => !isViewed(file)) || null;
    }

    // Find next unviewed file after current
    for (let i = currentIndex + 1; i < files.length; i++) {
        if (!isViewed(files[i])) {
            return files[i];
        }
    }

    return null;
}

/**
 * Add flash animation to file element
 */
function flashFile(fileElement: HTMLElement, timers: number[]): void {
    const cl = fileElement.classList;
    cl.add('gh-autoscroll-flash');
    const timerId = window.setTimeout(() => {
        cl.remove('gh-autoscroll-flash');
    }, 1500);
    timers.push(timerId);
}

/**
 * Extract filename from file element
 */
function getFileName(fileElement: HTMLElement): string {
    // Method 1: data attributes
    const dataPath =
        fileElement.getAttribute('data-path') || fileElement.getAttribute('data-tagsearch-path');
    if (dataPath) return dataPath;

    // Method 2: Look for file path in links or spans with title attributes
    const titleEl = fileElement.querySelector('[title]');
    if (titleEl && titleEl.getAttribute('title')) {
        const title = titleEl.getAttribute('title')!;
        // Skip generic titles like "Viewed" or "Toggle diff"
        if (!title.includes('Viewed') && !title.includes('Toggle') && !title.includes('diff')) {
            return title;
        }
    }

    // Method 3: Look for filename in text content of specific selectors
    const filenameSelectors = [
        'a[href*="/blob/"]',
        '.file-info a',
        '[data-testid="file-header"] a',
        '.js-file-line-container a',
    ];

    for (const selector of filenameSelectors) {
        const el = fileElement.querySelector(selector);
        if (el && el.textContent && el.textContent.trim()) {
            return el.textContent.trim();
        }
    }

    // Method 4: Look for any link that looks like a file path
    const links = fileElement.querySelectorAll('a');
    for (const link of links) {
        const text = link.textContent?.trim();
        if (text && (text.includes('/') || text.includes('.'))) {
            return text;
        }
    }

    return 'unknown file';
}

/**
 * Handle "Viewed" button click
 */
function onButtonClick(event: Event, timers: number[], debug: boolean): void {
    const button = (event.target as Element).closest('button');
    if (!button || !button.textContent?.includes('Viewed')) {
        return;
    }

    // Find the file element - try new GitHub UI first, then fall back to old structure
    let fileElement: HTMLElement | null = null;

    // Try new GitHub UI (2025+): DiffFileHeader-module__diff-file-header
    fileElement = button.closest(
        '[class*="DiffFileHeader-module__diff-file-header__"]',
    ) as HTMLElement;

    // Try old GitHub UI: Diff-module__diffHeaderWrapper
    if (!fileElement) {
        const wrapper = button.closest('[class*="Diff-module__diffHeaderWrapper--"]');
        fileElement = wrapper
            ? (wrapper.firstElementChild as HTMLElement)
            : (button.closest(
                  '[data-tagsearch-path], [data-path], .file-header, .Box-row, .file, .js-file',
              ) as HTMLElement);
    }

    if (!fileElement) {
        if (debug) {
            console.log('[GitHub AutoScroll] Could not find file element for button');
        }
        return;
    }

    // Check if file is now marked as viewed after the click.
    // We need to wait for GitHub's handler to update the aria-pressed attribute.
    // The 100ms delay is necessary because:
    // 1. Our handler fires before GitHub's handler (event bubbling)
    // 2. GitHub's handler updates aria-pressed asynchronously
    // 3. We need to check the updated state to decide whether to scroll
    const timerId = window.setTimeout(() => {
        if (!isViewed(fileElement)) {
            // File was unmarked as viewed
            if (debug) {
                console.log(
                    '[GitHub AutoScroll] File unmarked as viewed:',
                    getFileName(fileElement),
                );
            }
            return;
        }

        if (debug) {
            console.log('[GitHub AutoScroll] File marked as viewed:', getFileName(fileElement));
        }

        // Find and scroll to next unviewed file
        const nextFile = findNextUnviewedAfter(fileElement);
        if (nextFile) {
            scrollElementTop(nextFile, {offsetTop: 0});
            flashFile(nextFile, timers);
            if (debug) {
                console.log('[GitHub AutoScroll] Scrolled to:', getFileName(nextFile));
            }
        } else {
            if (debug) {
                console.log('[GitHub AutoScroll] No more unviewed files');
            }
        }
    }, 100);
    timers.push(timerId);
}

/**
 * Initialize autoscroll functionality
 * Returns a function to stop/cleanup, or null if no files found
 * @param debug - Enable debug console logging (default: false)
 */
export function initializeAutoScroll(debug = false): (() => void) | null {
    if (debug) {
        console.log('[GitHub AutoScroll] Initializing...');
    }

    // Check for files before attaching any listeners or styles, so a failed
    // init leaves no behavior behind
    const files = getFiles();
    if (files.length === 0) {
        if (debug) {
            console.log('[GitHub AutoScroll] No files found');
        }
        return null;
    }

    // Track all setTimeout IDs for cleanup
    const timers: number[] = [];

    // Inject CSS for flash animation (check for existing style first)
    let style = document.getElementById('gh-autoscroll-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'gh-autoscroll-styles';
        style.textContent = `
            .gh-autoscroll-flash {
                position: relative;
            }
            .gh-autoscroll-flash::after {
                content: "";
                position: absolute;
                z-index: 10;
                inset: 0;
                border: 8px solid ${theme.flashBorder};
                pointer-events: none;
                animation: flashBorder 0.75s ease alternate 2;
            }
            @keyframes flashBorder {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Add click listener at document level with capture phase
    const clickHandler = (e: Event) => onButtonClick(e, timers, debug);
    document.addEventListener('click', clickHandler, true);

    if (debug) {
        console.log(`[GitHub AutoScroll] Monitoring ${files.length} files`);
    }

    // Scroll to first unviewed file
    const firstUnviewed = files.find((file) => !isViewed(file));
    if (firstUnviewed) {
        const fileName = getFileName(firstUnviewed);
        if (debug) {
            console.log('[GitHub AutoScroll] Scrolling to first unviewed file:', fileName);
        }
        scrollElementTop(firstUnviewed, {offsetTop: 0});
        flashFile(firstUnviewed, timers);
    }

    // Return cleanup function
    const stop = () => {
        if (debug) {
            console.log('[GitHub AutoScroll] Stopping...');
        }

        // Clear all pending timers
        timers.forEach((timerId) => {
            clearTimeout(timerId);
        });
        timers.length = 0;

        // Remove document-level listeners
        document.removeEventListener('click', clickHandler, true);

        // Remove CSS - use direct reference to the style element we created
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }

        // Remove from window
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__ghAutoScrollStop;
    };

    // Store stop function in window for manual access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__ghAutoScrollStop = stop;

    return stop;
}
