import {describe, it, expect, beforeEach, vi} from 'vitest';
import {AtlassianHandler} from '@exo/lib/richlink/handlers/atlassian.handler';

describe('AtlassianHandler', () => {
    let handler: AtlassianHandler;

    beforeEach(() => {
        handler = new AtlassianHandler();
    });

    it('should handle Atlassian URLs', () => {
        expect(handler.canHandle('https://company.atlassian.net/wiki/spaces/ENG/pages/123')).toBe(
            true,
        );
        expect(handler.canHandle('https://company.atlassian.net/browse/PROJ-123')).toBe(true);
        expect(handler.canHandle('https://example.com')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback()).toBe(false);
    });

    it('should have priority 30', () => {
        expect(handler.getPriority()).toBe(30);
    });

    it('should return "Confluence Page" label for wiki URLs', () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://company.atlassian.net/wiki/spaces/ENG/pages/123',
            },
        });
        expect(handler.getLabel()).toBe('Confluence Page');
    });

    it('should return "Jira Issue" label for browse URLs', () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://company.atlassian.net/browse/PROJ-123',
            },
        });
        expect(handler.getLabel()).toBe('Jira Issue');
    });

    it('should return "Atlassian Page" label for other URLs', () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://company.atlassian.net/jira/dashboard',
            },
        });
        expect(handler.getLabel()).toBe('Atlassian Page');
    });

    it('should extract Confluence page title', async () => {
        const mockTitle = document.createElement('h1');
        mockTitle.id = 'title-text';
        mockTitle.textContent = 'Engineering Guidelines';
        document.body.appendChild(mockTitle);

        vi.stubGlobal('window', {
            location: {
                href: 'https://company.atlassian.net/wiki/spaces/ENG/pages/123',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://company.atlassian.net/wiki/spaces/ENG/pages/123">Engineering Guidelines</a>',
        );

        const text = await handler.getText();
        expect(text).toBe(
            'Engineering Guidelines (https://company.atlassian.net/wiki/spaces/ENG/pages/123)',
        );

        document.body.removeChild(mockTitle);
    });

    it('should extract Jira issue title', async () => {
        const mockSummary = document.createElement('h1');
        mockSummary.setAttribute(
            'data-test-id',
            'issue.views.issue-base.foundation.summary.heading',
        );
        mockSummary.textContent = 'Fix login bug';
        document.body.appendChild(mockSummary);

        vi.stubGlobal('window', {
            location: {
                href: 'https://company.atlassian.net/browse/PROJ-123',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://company.atlassian.net/browse/PROJ-123">Fix login bug</a>',
        );

        const text = await handler.getText();
        expect(text).toBe('Fix login bug (https://company.atlassian.net/browse/PROJ-123)');

        document.body.removeChild(mockSummary);
    });

    it('should handle missing Confluence title', async () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://company.atlassian.net/wiki/spaces/ENG/pages/123',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://company.atlassian.net/wiki/spaces/ENG/pages/123">Confluence Page</a>',
        );
    });

    it('should handle missing Jira title', async () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://company.atlassian.net/browse/PROJ-123',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://company.atlassian.net/browse/PROJ-123">Jira Issue</a>');
    });

    it('should use alternative Jira selector', async () => {
        const mockSummary = document.createElement('h1');
        mockSummary.id = 'summary-val';
        mockSummary.textContent = 'Update documentation';
        document.body.appendChild(mockSummary);

        vi.stubGlobal('window', {
            location: {
                href: 'https://company.atlassian.net/browse/PROJ-456',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://company.atlassian.net/browse/PROJ-456">Update documentation</a>',
        );

        document.body.removeChild(mockSummary);
    });
});
