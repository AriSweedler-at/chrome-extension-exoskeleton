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
    // Look for GitHub's CSS module classes with dynamic suffixes
    // Target: class starting with 'Diff-module__diffHeaderWrapper--'
    const container = document.querySelector('[data-hpc="true"] .d-flex.flex-column.gap-3');

    if (container) {
        const diffHeaders = Array.from(
            container.querySelectorAll('[class*="Diff-module__diffHeaderWrapper--"]')
        );
        if (diffHeaders.length > 0) {
            return diffHeaders as HTMLElement[];
        }
    }

    // Fallback: search globally for the diff header wrapper pattern
    const globalDiffHeaders = Array.from(
        document.querySelectorAll('[class*="Diff-module__diffHeaderWrapper--"]')
    );
    if (globalDiffHeaders.length > 0) {
        return globalDiffHeaders as HTMLElement[];
    }

    // Final fallback selectors
    const fallbackSelectors = [
        '[data-testid*="file"]',
        '[data-tagsearch-path]',
        '[data-path]',
        '.file-header',
        '.file',
        '.js-file',
    ];

    for (const selector of fallbackSelectors) {
        const files = Array.from(document.querySelectorAll(selector));
        if (files.length > 0) {
            return files as HTMLElement[];
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
 * Scroll an element to center of viewport
 */
function scrollElementCenter(element: HTMLElement): void {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

/**
 * Add flash animation to file element
 */
function flashFile(fileElement: HTMLElement, timers: number[]): void {
    fileElement.classList.add('gh-autoscroll-flash');
    const timerId = window.setTimeout(() => {
        fileElement.classList.remove('gh-autoscroll-flash');
    }, 1000);
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
    const button = event.currentTarget as HTMLButtonElement;
    const fileElement = button.closest('[class*="Diff-module__diffHeaderWrapper"]') as HTMLElement;

    if (!fileElement) {
        return;
    }

    // Check if file is now marked as viewed after the click.
    // We need to wait for GitHub's handler to update the aria-pressed attribute.
    // The 100ms delay is necessary because:
    // 1. Our handler fires before GitHub's handler (event bubbling)
    // 2. GitHub's handler updates aria-pressed asynchronously
    // 3. We need to check the updated state to decide whether to scroll
    // Note: Could increase to 200ms if experiencing race conditions on slower systems
    const timerId = window.setTimeout(() => {
        if (isViewed(fileElement)) {
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
        }
    }, 100);
    timers.push(timerId);
}

/**
 * Initialize autoscroll functionality
 * Returns a function to stop/cleanup
 * @param debug - Enable debug console logging (default: false)
 */
export function initializeAutoScroll(debug = false): () => void {
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
            @keyframes gh-autoscroll-flash {
                0%, 100% { background-color: transparent; }
                50% { background-color: rgba(255, 223, 0, 0.3); }
            }
            .gh-autoscroll-flash {
                animation: gh-autoscroll-flash 1s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }

    // Add click listeners to all "Viewed" buttons
    const files = getFiles();
    const listeners: Array<{element: Element; handler: EventListener}> = [];

    files.forEach(file => {
        const button = file.querySelector('button[aria-pressed]');
        if (button) {
            const handler = (e: Event) => onButtonClick(e, timers, debug);
            button.addEventListener('click', handler);
            listeners.push({element: button, handler});
        }
    });

    if (debug) {
        console.log(`[GitHub AutoScroll] Monitoring ${listeners.length} files`);
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

        // Remove all listeners
        listeners.forEach(({element, handler}) => {
            element.removeEventListener('click', handler);
        });

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
