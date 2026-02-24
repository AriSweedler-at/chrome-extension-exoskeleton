import {describe, it, expect, beforeEach, vi} from 'vitest';
import {GitHubHandler} from '@exo/exo-tabs/richlink/handlers/github.handler';

describe('GitHubHandler', () => {
    let handler: GitHubHandler;

    beforeEach(() => {
        handler = new GitHubHandler();
    });

    it('should handle GitHub PR URLs and sub-pages', () => {
        expect(handler.canHandle('https://github.com/user/repo/pull/123')).toBe(true);
        expect(handler.canHandle('https://github.com/user/repo/pull/456/files')).toBe(true);
        expect(handler.canHandle('https://github.com/user/repo/pull/789/commits')).toBe(true);
        expect(handler.canHandle('https://github.com/user/repo/pull/789/checks')).toBe(true);
        expect(handler.canHandle('https://github.com/user/repo/pull/789/changes')).toBe(true);
        expect(handler.canHandle('https://github.com/user/repo/pull/123?tab=overview')).toBe(true);
        expect(handler.canHandle('https://github.com/user/repo')).toBe(false);
        expect(handler.canHandle('https://github.com/user/repo/issues/123')).toBe(false);
        expect(handler.canHandle('https://example.com')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback()).toBe(false);
    });

    it('should have priority 10', () => {
        expect(handler.priority).toBe(10);
    });

    it('should return "GitHub PR" as label', () => {
        expect(handler.label).toBe('GitHub PR');
    });

    it('should extract PR title from GitHub page', async () => {
        // Mock GitHub PR page DOM with modern selector
        const mockTitle = document.createElement('span');
        mockTitle.className = 'markdown-title';
        mockTitle.textContent = 'Fix bug in authentication';
        document.body.appendChild(mockTitle);

        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/user/repo/pull/123',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://github.com/user/repo/pull/123">Fix bug in authentication (#123)</a>',
        );

        const text = await handler.getText();
        expect(text).toBe(
            'Fix bug in authentication (#123) (https://github.com/user/repo/pull/123)',
        );

        document.body.removeChild(mockTitle);
    });

    it('should handle missing PR title', async () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/user/repo/pull/456',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://github.com/user/repo/pull/456">GitHub PR</a>');
    });

    it('should extract PR title from sub-pages like /files', async () => {
        // Mock GitHub PR files page DOM with modern selector
        const mockTitle = document.createElement('span');
        mockTitle.className = 'markdown-title';
        mockTitle.textContent = 'feat(escalation_agent): Add thread context to agent prompts';
        document.body.appendChild(mockTitle);

        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/anthropics/escalation/pull/200045/files',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://github.com/anthropics/escalation/pull/200045/files">feat(escalation_agent): Add thread context to agent prompts (#200045)</a>',
        );

        const text = await handler.getText();
        expect(text).toBe(
            'feat(escalation_agent): Add thread context to agent prompts (#200045) (https://github.com/anthropics/escalation/pull/200045/files)',
        );

        document.body.removeChild(mockTitle);
    });
});
