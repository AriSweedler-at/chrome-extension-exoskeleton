import {describe, it, expect, beforeEach, vi} from 'vitest';
import {GitHubHandler} from '../../../../src/library/richlink/handlers/github.handler';

describe('GitHubHandler', () => {
    let handler: GitHubHandler;

    beforeEach(() => {
        handler = new GitHubHandler();
    });

    it('should handle GitHub URLs', () => {
        expect(handler.canHandle('https://github.com/user/repo')).toBe(true);
        expect(handler.canHandle('https://github.com/user/repo/pull/123')).toBe(true);
        expect(handler.canHandle('https://example.com')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback()).toBe(false);
    });

    it('should have priority 10', () => {
        expect(handler.getPriority()).toBe(10);
    });

    it('should return "GitHub PR" as label', () => {
        expect(handler.getLabel()).toBe('GitHub PR');
    });

    it('should extract PR title from GitHub page', async () => {
        // Mock GitHub PR page DOM
        const mockTitle = document.createElement('span');
        mockTitle.className = 'js-issue-title';
        mockTitle.textContent = 'Fix bug in authentication';
        document.body.appendChild(mockTitle);

        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/user/repo/pull/123',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://github.com/user/repo/pull/123">Fix bug in authentication</a>');

        const text = await handler.getText();
        expect(text).toBe('Fix bug in authentication (https://github.com/user/repo/pull/123)');

        document.body.removeChild(mockTitle);
    });

    it('should handle missing PR title', async () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/user/repo',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://github.com/user/repo">GitHub Page</a>');
    });
});
