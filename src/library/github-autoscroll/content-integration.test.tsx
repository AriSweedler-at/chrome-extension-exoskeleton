import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

describe('GitHub Autoscroll Content Script Integration', () => {
    let messageListeners: any[] = [];

    beforeEach(async () => {
        messageListeners = [];
        vi.stubGlobal('chrome', {
            runtime: {
                onMessage: {
                    addListener: vi.fn((listener) => {
                        messageListeners.push(listener);
                    }),
                },
                sendMessage: vi.fn(),
            },
            storage: {
                local: {
                    get: vi.fn((key, callback) => {
                        callback({});
                    }),
                },
            },
            tabs: {
                query: vi.fn(),
                sendMessage: vi.fn(),
            },
        });
        (window as any).__ghAutoScrollStop = undefined;

        // Mock DOM elements needed for initialization
        document.body.innerHTML = '';

        // Reset module registry to ensure fresh imports
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('registers message listener on load', async () => {
        await import('@content/index');
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('responds to GITHUB_AUTOSCROLL_GET_STATUS when inactive', async () => {
        await import('@content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        const sendResponse = vi.fn();
        githubListener({type: 'GITHUB_AUTOSCROLL_GET_STATUS'}, {}, sendResponse);

        expect(sendResponse).toHaveBeenCalledWith({active: false});
    });

    it('responds to GITHUB_AUTOSCROLL_GET_STATUS when active', async () => {
        await import('@content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        // Simulate autoscroll being active
        (window as any).__ghAutoScrollStop = vi.fn();

        const sendResponse = vi.fn();
        githubListener({type: 'GITHUB_AUTOSCROLL_GET_STATUS'}, {}, sendResponse);

        expect(sendResponse).toHaveBeenCalledWith({active: true});
    });

    it('starts autoscroll on GITHUB_AUTOSCROLL_TOGGLE when inactive', async () => {
        await import('@content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        // Mock GitHub PR page structure with files
        const container = document.createElement('div');
        container.setAttribute('data-hpc', 'true');
        const filesContainer = document.createElement('div');
        filesContainer.className = 'd-flex flex-column gap-3';

        // Add a file element so initializeAutoScroll doesn't return null
        const fileElement = document.createElement('div');
        fileElement.className = 'Diff-module__diffHeaderWrapper--abc123';
        const button = document.createElement('button');
        button.setAttribute('aria-pressed', 'false');
        button.textContent = 'Viewed';
        fileElement.appendChild(button);
        filesContainer.appendChild(fileElement);

        container.appendChild(filesContainer);
        document.body.appendChild(container);

        const sendResponse = vi.fn();
        const result = githubListener({type: 'GITHUB_AUTOSCROLL_TOGGLE'}, {}, sendResponse);

        expect(result).toBe(true); // Async handler
        expect(sendResponse).toHaveBeenCalledWith({active: true});
        expect((window as any).__ghAutoScrollStop).toBeTypeOf('function');
    });

    it('stops autoscroll on GITHUB_AUTOSCROLL_TOGGLE when active', async () => {
        await import('@content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        // Simulate autoscroll being active
        const stopFn = vi.fn();
        (window as any).__ghAutoScrollStop = stopFn;

        const sendResponse = vi.fn();
        githubListener({type: 'GITHUB_AUTOSCROLL_TOGGLE'}, {}, sendResponse);

        expect(stopFn).toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({active: false});
    });

    it('returns false for unknown message types', async () => {
        await import('@content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        const sendResponse = vi.fn();
        const result = githubListener({type: 'UNKNOWN_MESSAGE'}, {}, sendResponse);

        expect(result).toBe(false);
        expect(sendResponse).not.toHaveBeenCalled();
    });

    describe('Auto-run on load', () => {
        it('auto-runs on GitHub PR changes page with default setting', async () => {
            // Mock GitHub PR page URL
            vi.stubGlobal('location', {
                href: 'https://github.com/owner/repo/pull/123/changes',
            });

            // Mock GitHub PR page structure with files
            document.body.innerHTML = `
                <div data-hpc="true">
                    <div class="d-flex flex-column gap-3">
                        <div class="Diff-module__diffHeaderWrapper--abc123">
                            <button aria-pressed="false">Viewed</button>
                        </div>
                    </div>
                </div>
            `;

            // Mock storage to return undefined (default behavior)
            chrome.storage.local.get = vi.fn((key, callback) => {
                callback({});
            });

            await import('@content/index');

            // Wait for auto-run (500ms delay + buffer)
            await new Promise((resolve) => setTimeout(resolve, 600));

            expect((window as any).__ghAutoScrollStop).toBeTypeOf('function');
        });

        it('respects exorun-github-autoscroll storage setting (false)', async () => {
            // Mock GitHub PR page URL
            vi.stubGlobal('location', {
                href: 'https://github.com/owner/repo/pull/123/changes',
            });

            // Mock GitHub PR page structure with files
            document.body.innerHTML = `
                <div data-hpc="true">
                    <div class="d-flex flex-column gap-3">
                        <div class="Diff-module__diffHeaderWrapper--abc123">
                            <button aria-pressed="false">Viewed</button>
                        </div>
                    </div>
                </div>
            `;

            // Mock storage to return false
            chrome.storage.local.get = vi.fn((key, callback) => {
                callback({'exorun-github-autoscroll': false});
            });

            await import('@content/index');

            // Trigger the load event
            const loadEvent = new Event('load');
            window.dispatchEvent(loadEvent);

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect((window as any).__ghAutoScrollStop).toBeUndefined();
        });

        it('does not auto-run on non-GitHub pages', async () => {
            // Mock non-GitHub URL
            vi.stubGlobal('location', {
                href: 'https://example.com',
            });

            // Mock storage to return true (auto-run enabled)
            chrome.storage.local.get = vi.fn((key, callback) => {
                callback({'exorun-github-autoscroll': true});
            });

            await import('@content/index');

            // Trigger the load event
            const loadEvent = new Event('load');
            window.dispatchEvent(loadEvent);

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect((window as any).__ghAutoScrollStop).toBeUndefined();
        });

        it('does not auto-run if autoscroll is already active (race condition)', async () => {
            // Mock GitHub PR page URL
            vi.stubGlobal('location', {
                href: 'https://github.com/owner/repo/pull/123/changes',
            });

            // Mock GitHub PR page structure with files
            document.body.innerHTML = `
                <div data-hpc="true">
                    <div class="d-flex flex-column gap-3">
                        <div class="Diff-module__diffHeaderWrapper--abc123">
                            <button aria-pressed="false">Viewed</button>
                        </div>
                    </div>
                </div>
            `;

            // Simulate autoscroll already being active
            const existingStopFn = vi.fn();
            (window as any).__ghAutoScrollStop = existingStopFn;

            // Mock storage to return undefined (default behavior)
            chrome.storage.local.get = vi.fn((key, callback) => {
                callback({});
            });

            await import('@content/index');

            // Trigger the load event
            const loadEvent = new Event('load');
            window.dispatchEvent(loadEvent);

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Should still be the original function, not replaced
            expect((window as any).__ghAutoScrollStop).toBe(existingStopFn);
        });
    });
});
