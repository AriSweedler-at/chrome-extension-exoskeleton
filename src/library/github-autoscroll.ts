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
    // Find the container with data-hpc="true"
    const container = document.querySelector('[data-hpc="true"]');
    if (!container) {
        return [];
    }

    // Find the direct child with the specific class pattern
    const filesContainer = container.querySelector('.d-flex.flex-column.gap-3');
    if (!filesContainer) {
        return [];
    }

    // Get all diff header wrappers (files)
    const files = Array.from(
        filesContainer.querySelectorAll('[class*="Diff-module__diffHeaderWrapper"]')
    );

    return files as HTMLElement[];
}

/**
 * Check if a file is marked as viewed
 */
function isViewed(fileElement: HTMLElement): boolean {
    const button = fileElement.querySelector('button[aria-pressed]');
    if (!button) {
        return false;
    }
    return button.getAttribute('aria-pressed') === 'true';
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
function flashFile(fileElement: HTMLElement): void {
    fileElement.classList.add('gh-autoscroll-flash');
    setTimeout(() => {
        fileElement.classList.remove('gh-autoscroll-flash');
    }, 1000);
}

/**
 * Extract filename from file element
 */
function getFileName(fileElement: HTMLElement): string {
    // Try to find the filename in the header
    const fileNameElement = fileElement.querySelector('[class*="Diff-module__fileName"]');
    if (fileNameElement) {
        return fileNameElement.textContent?.trim() || 'Unknown file';
    }
    return 'Unknown file';
}

/**
 * Handle "Viewed" button click
 */
function onButtonClick(event: Event): void {
    const button = event.currentTarget as HTMLButtonElement;
    const fileElement = button.closest('[class*="Diff-module__diffHeaderWrapper"]') as HTMLElement;

    if (!fileElement) {
        return;
    }

    // Check if file is now marked as viewed after the click
    // We need to wait a tick for GitHub's handler to update aria-pressed
    setTimeout(() => {
        if (isViewed(fileElement)) {
            // Find and scroll to next unviewed file
            const nextFile = findNextUnviewedAfter(fileElement);
            if (nextFile) {
                scrollElementCenter(nextFile);
                flashFile(nextFile);
                console.log('[GitHub AutoScroll] Scrolled to:', getFileName(nextFile));
            } else {
                console.log('[GitHub AutoScroll] No more unviewed files');
            }
        }
    }, 100);
}

/**
 * Initialize autoscroll functionality
 * Returns a function to stop/cleanup
 */
export function initializeAutoScroll(): () => void {
    console.log('[GitHub AutoScroll] Initializing...');

    // Inject CSS for flash animation
    const style = document.createElement('style');
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

    // Add click listeners to all "Viewed" buttons
    const files = getFiles();
    const listeners: Array<{element: Element; handler: EventListener}> = [];

    files.forEach(file => {
        const button = file.querySelector('button[aria-pressed]');
        if (button) {
            const handler = (e: Event) => onButtonClick(e);
            button.addEventListener('click', handler);
            listeners.push({element: button, handler});
        }
    });

    console.log(`[GitHub AutoScroll] Monitoring ${listeners.length} files`);

    // Return cleanup function
    const stop = () => {
        console.log('[GitHub AutoScroll] Stopping...');

        // Remove all listeners
        listeners.forEach(({element, handler}) => {
            element.removeEventListener('click', handler);
        });

        // Remove CSS - use direct reference to the style element we created
        if (style.parentNode) {
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
