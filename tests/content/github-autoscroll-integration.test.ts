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
        await import('../../src/content/index');
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    it('responds to GITHUB_AUTOSCROLL_GET_STATUS when inactive', async () => {
        await import('../../src/content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        const sendResponse = vi.fn();
        githubListener(
            {type: 'GITHUB_AUTOSCROLL_GET_STATUS'},
            {},
            sendResponse
        );

        expect(sendResponse).toHaveBeenCalledWith({active: false});
    });

    it('responds to GITHUB_AUTOSCROLL_GET_STATUS when active', async () => {
        await import('../../src/content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        // Simulate autoscroll being active
        (window as any).__ghAutoScrollStop = vi.fn();

        const sendResponse = vi.fn();
        githubListener(
            {type: 'GITHUB_AUTOSCROLL_GET_STATUS'},
            {},
            sendResponse
        );

        expect(sendResponse).toHaveBeenCalledWith({active: true});
    });

    it('starts autoscroll on GITHUB_AUTOSCROLL_TOGGLE when inactive', async () => {
        await import('../../src/content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        // Mock GitHub PR page structure
        const container = document.createElement('div');
        container.setAttribute('data-hpc', 'true');
        const filesContainer = document.createElement('div');
        filesContainer.className = 'd-flex flex-column gap-3';
        container.appendChild(filesContainer);
        document.body.appendChild(container);

        const sendResponse = vi.fn();
        const result = githubListener(
            {type: 'GITHUB_AUTOSCROLL_TOGGLE'},
            {},
            sendResponse
        );

        expect(result).toBe(true); // Async handler
        expect(sendResponse).toHaveBeenCalledWith({active: true});
        expect((window as any).__ghAutoScrollStop).toBeTypeOf('function');
    });

    it('stops autoscroll on GITHUB_AUTOSCROLL_TOGGLE when active', async () => {
        await import('../../src/content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        // Simulate autoscroll being active
        const stopFn = vi.fn();
        (window as any).__ghAutoScrollStop = stopFn;

        const sendResponse = vi.fn();
        githubListener(
            {type: 'GITHUB_AUTOSCROLL_TOGGLE'},
            {},
            sendResponse
        );

        expect(stopFn).toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({active: false});
    });

    it('returns false for unknown message types', async () => {
        await import('../../src/content/index');

        // Find the GitHub autoscroll listener (the last one registered)
        const githubListener = messageListeners[messageListeners.length - 1];

        const sendResponse = vi.fn();
        const result = githubListener(
            {type: 'UNKNOWN_MESSAGE'},
            {},
            sendResponse
        );

        expect(result).toBe(false);
        expect(sendResponse).not.toHaveBeenCalled();
    });
});
