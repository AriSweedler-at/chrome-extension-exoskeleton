import {scrollElementCenter, scrollElementTop} from './scroll-utils';
import { keybindings } from './keybindings';
import {theme} from '../theme/default';

/**
 * Check if URL is a GitHub PR changes page
 */
export function isGitHubPRChangesPage(url: string): boolean {
    try {
        const urlObj = new URL(url);

        // Check hostname (support both github.com and www.github.com)
        const hostname = urlObj.hostname.toLowerCase();
        if (hostname !== 'github.com' && hostname !== 'www.github.com') {
            return false;
        }

        // Parse pathname (ignoring query params and fragments)
        const pathParts = urlObj.pathname.split('/').filter(part => part !== '');

        // Expected format: owner/repo/pull/{number}/changes
        if (pathParts.length < 5) {
            return false;
        }

        // Check pattern: pathParts[2] === 'pull', pathParts[3] === PR number, pathParts[4] === 'changes'
        const isPullRequest = pathParts[2] === 'pull';
        const prNumber = pathParts[3];
        const isChangesPage = pathParts[4] === 'changes';

        // Validate PR number is purely numeric using regex
        const isPRNumberValid = /^\d+$/.test(prNumber);

        return isPullRequest && isPRNumberValid && isChangesPage;
    } catch {
        // Invalid URL
        return false;
    }
}

/**
 * Get all file elements in the PR changes view
 */
function getFiles(): HTMLElement[] {
    // New GitHub UI: Look for DiffFileHeader-module__diff-file-header class (current 2025+ design)
    const diffFileHeaders = Array.from(
        document.querySelectorAll('[class*="DiffFileHeader-module__diff-file-header__"]')
    );
    if (diffFileHeaders.length > 0) {
        return diffFileHeaders as HTMLElement[];
    }

    // Look for GitHub's CSS module classes with dynamic suffixes
    // Target: class starting with 'Diff-module__diffHeaderWrapper--'
    const container = document.querySelector('[data-hpc="true"] .d-flex.flex-column.gap-3');

    if (container) {
        const diffHeaderWrappers = Array.from(
            container.querySelectorAll('[class*="Diff-module__diffHeaderWrapper--"]')
        );
        if (diffHeaderWrappers.length > 0) {
            // Extract the actual file header (first child) from each wrapper
            return diffHeaderWrappers
                .map(wrapper => wrapper.firstElementChild as HTMLElement)
                .filter(el => el !== null);
        }
    }

    // Fallback: search globally for the diff header wrapper pattern
    const globalDiffHeaderWrappers = Array.from(
        document.querySelectorAll('[class*="Diff-module__diffHeaderWrapper--"]')
    );
    if (globalDiffHeaderWrappers.length > 0) {
        // Extract the actual file header (first child) from each wrapper
        return globalDiffHeaderWrappers
            .map(wrapper => wrapper.firstElementChild as HTMLElement)
            .filter(el => el !== null);
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
            const filtered = files.filter(el => {
                const testId = el.getAttribute('data-testid');
                // Exclude file tree buttons and controls
                if (testId && (
                    testId.includes('expand-file-tree') ||
                    testId.includes('collapse-file-tree') ||
                    testId.includes('file-controls-divider')
                )) {
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
        fileElement.closest('div')?.querySelector('[class*="MarkAsViewedButton-module__viewed--"]') ||
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
        return files.find(file => !isViewed(file)) || null;
    }

    // Find index of current file
    const currentIndex = files.indexOf(currentFile);
    if (currentIndex === -1) {
        return files.find(file => !isViewed(file)) || null;
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
 * Find the previous unviewed file before the given element
 */
function findPreviousUnviewedBefore(currentFile: HTMLElement | null): HTMLElement | null {
    const files = getFiles();

    if (files.length === 0) {
        return null;
    }

    // If no current file, return last unviewed
    if (!currentFile) {
        for (let i = files.length - 1; i >= 0; i--) {
            if (!isViewed(files[i])) {
                return files[i];
            }
        }
        return null;
    }

    // Find index of current file
    const currentIndex = files.indexOf(currentFile);
    if (currentIndex === -1) {
        // Return last unviewed
        for (let i = files.length - 1; i >= 0; i--) {
            if (!isViewed(files[i])) {
                return files[i];
            }
        }
        return null;
    }

    // Find previous unviewed file before current
    for (let i = currentIndex - 1; i >= 0; i--) {
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
    fileElement = button.closest('[class*="DiffFileHeader-module__diff-file-header__"]') as HTMLElement;

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
                console.log('[GitHub AutoScroll] File unmarked as viewed:', getFileName(fileElement));
            }
            return;
        }

        if (debug) {
            console.log('[GitHub AutoScroll] File marked as viewed:', getFileName(fileElement));
        }

        // Find and scroll to next unviewed file
        const nextFile = findNextUnviewedAfter(fileElement);
        if (nextFile) {
            scrollElementCenter(nextFile);
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
 * Find the file element currently in view (closest to top of viewport)
 */
function getCurrentFileInView(): HTMLElement | null {
    const files = getFiles();
    if (files.length === 0) return null;

    // Find file whose top edge is closest to our target scroll position (100px from top)
    const targetY = 100;
    let closestFile: HTMLElement | null = null;
    let closestDistance = Infinity;

    for (const file of files) {
        const rect = file.getBoundingClientRect();
        const distance = Math.abs(rect.top - targetY);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestFile = file;
        }
    }

    return closestFile;
}

/**
 * Find the file element currently in view for previous navigation
 * This is more lenient - includes files whose body is visible even if header is scrolled off
 */
function getCurrentFileForPrevious(): HTMLElement | null {
    const files = getFiles();
    if (files.length === 0) return null;

    // Find the first file whose bottom is below the top of the viewport
    // This means we're currently viewing this file (or past it)
    for (const file of files) {
        const rect = file.getBoundingClientRect();
        // If the file extends below the top of viewport (even if header is above)
        if (rect.bottom > 0) {
            return file;
        }
    }

    return files[files.length - 1]; // Default to last file
}

/**
 * Mark the current file as viewed by clicking its "Viewed" button
 */
function markCurrentFileAsViewed(debug: boolean): void {
    const currentFile = getCurrentFileInView();
    if (!currentFile) {
        if (debug) {
            console.log('[GitHub AutoScroll] No file in view to mark as viewed');
        }
        return;
    }

    // Find the "Viewed" button for this file
    const button =
        currentFile.querySelector('button[aria-pressed]') ||
        currentFile.closest('div')?.querySelector('button[aria-pressed]') ||
        currentFile.parentElement?.querySelector('button[aria-pressed]');

    if (button && button.textContent?.includes('Viewed')) {
        if (debug) {
            console.log('[GitHub AutoScroll] Marking file as viewed:', getFileName(currentFile));
        }
        (button as HTMLButtonElement).click();
    } else {
        if (debug) {
            console.log('[GitHub AutoScroll] Could not find Viewed button for:', getFileName(currentFile));
        }
    }
}

/**
 * Navigate to the next unviewed file
 */
function goToNextUnviewed(timers: number[], debug: boolean): void {
    const currentFile = getCurrentFileInView();
    const nextFile = findNextUnviewedAfter(currentFile);

    if (nextFile) {
        scrollElementCenter(nextFile);
        flashFile(nextFile, timers);
        if (debug) {
            console.log('[GitHub AutoScroll] Next unviewed:', getFileName(nextFile));
        }
    } else {
        if (debug) {
            console.log('[GitHub AutoScroll] No more unviewed files after current');
        }
    }
}

/**
 * Navigate to the previous unviewed file
 */
function goToPreviousUnviewed(timers: number[], debug: boolean): void {
    const currentFile = getCurrentFileForPrevious();
    const previousFile = findPreviousUnviewedBefore(currentFile);

    if (previousFile) {
        // Scroll to show top of file with less offset (20px) to show more of the body
        scrollElementTop(previousFile, {offsetTop: 20});
        flashFile(previousFile, timers);
        if (debug) {
            console.log('[GitHub AutoScroll] Previous unviewed:', getFileName(previousFile));
        }
    } else {
        if (debug) {
            console.log('[GitHub AutoScroll] No unviewed files before current');
        }
    }
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

    // Register keybindings
    keybindings.registerAll([
        {
            key: 'v',
            description: 'Mark current file as viewed',
            handler: () => markCurrentFileAsViewed(debug),
            context: 'GitHub PR'
        },
        {
            key: 'n',
            description: 'Navigate to next unviewed file',
            handler: () => goToNextUnviewed(timers, debug),
            context: 'GitHub PR'
        },
        {
            key: 'p',
            description: 'Navigate to previous unviewed file',
            handler: () => goToPreviousUnviewed(timers, debug),
            context: 'GitHub PR'
        }
    ]);
    keybindings.listen();

    // Check for files
    const files = getFiles();
    if (files.length === 0) {
        if (debug) {
            console.log('[GitHub AutoScroll] No files found');
        }
        return null;
    }

    if (debug) {
        console.log(`[GitHub AutoScroll] Monitoring ${files.length} files`);
    }

    // Scroll to first unviewed file
    const firstUnviewed = files.find(file => !isViewed(file));
    if (firstUnviewed) {
        const fileName = getFileName(firstUnviewed);
        if (debug) {
            console.log('[GitHub AutoScroll] Scrolling to first unviewed file:', fileName);
        }
        scrollElementCenter(firstUnviewed);
        flashFile(firstUnviewed, timers);
    }

    // Return cleanup function
    const stop = () => {
        if (debug) {
            console.log('[GitHub AutoScroll] Stopping...');
        }

        // Clear all pending timers
        timers.forEach(timerId => {
            clearTimeout(timerId);
        });
        timers.length = 0;

        // Remove document-level listeners
        document.removeEventListener('click', clickHandler, true);

        // Unregister keybindings
        keybindings.unregister('v');
        keybindings.unregister('n');
        keybindings.unregister('p');
        keybindings.unlisten();

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
