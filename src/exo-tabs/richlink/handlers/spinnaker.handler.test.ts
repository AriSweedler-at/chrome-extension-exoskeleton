import {describe, it, expect, beforeEach, vi} from 'vitest';
import {SpinnakerHandler} from '@exo/exo-tabs/richlink/handlers/spinnaker.handler';

describe('SpinnakerHandler', () => {
    let handler: SpinnakerHandler;

    beforeEach(() => {
        handler = new SpinnakerHandler();
    });

    it('should handle Spinnaker URLs', () => {
        expect(
            handler.canHandle('https://spinnaker.company.com/applications/myapp/executions'),
        ).toBe(true);
        expect(handler.canHandle('https://company-spinnaker.io/pipelines/abc123')).toBe(true);
        expect(handler.canHandle('https://spin.example.com')).toBe(false);
        expect(handler.canHandle('https://example.com')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback()).toBe(false);
    });

    it('should have priority 50', () => {
        expect(handler.priority).toBe(50);
    });

    it('should return "Spinnaker Pipeline" as label', () => {
        expect(handler.label).toBe('Spinnaker Pipeline');
    });

    it('should extract pipeline name from Spinnaker page', async () => {
        // Mock Spinnaker page DOM with pipeline name
        const mockPipelineName = document.createElement('h3');
        mockPipelineName.className = 'execution-group-title';
        mockPipelineName.textContent = 'Deploy to Production';
        document.body.appendChild(mockPipelineName);

        vi.stubGlobal('window', {
            location: {
                href: 'https://spinnaker.company.com/applications/myapp/executions',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://spinnaker.company.com/applications/myapp/executions">Deploy to Production</a>',
        );

        const text = await handler.getText();
        expect(text).toBe(
            'Deploy to Production (https://spinnaker.company.com/applications/myapp/executions)',
        );

        document.body.removeChild(mockPipelineName);
    });

    it('should handle missing pipeline name', async () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://spinnaker.company.com/applications/myapp',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://spinnaker.company.com/applications/myapp">Spinnaker Page</a>',
        );
    });

    it('should extract application name if pipeline name not found', async () => {
        const mockAppName = document.createElement('h2');
        mockAppName.className = 'application-header';
        mockAppName.textContent = 'my-service';
        document.body.appendChild(mockAppName);

        vi.stubGlobal('window', {
            location: {
                href: 'https://spinnaker.company.com/applications/myapp',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://spinnaker.company.com/applications/myapp">my-service</a>',
        );

        document.body.removeChild(mockAppName);
    });

    it('should extract execution details', async () => {
        const mockExecution = document.createElement('div');
        mockExecution.className = 'execution-name';
        mockExecution.textContent = 'Build #42';
        document.body.appendChild(mockExecution);

        vi.stubGlobal('window', {
            location: {
                href: 'https://spinnaker.company.com/applications/myapp/executions/details/exec123',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://spinnaker.company.com/applications/myapp/executions/details/exec123">Build #42</a>',
        );

        document.body.removeChild(mockExecution);
    });

    it('should handle pipeline config page', async () => {
        const mockConfig = document.createElement('h4');
        mockConfig.className = 'pipeline-config-name';
        mockConfig.textContent = 'Staging Deployment';
        document.body.appendChild(mockConfig);

        vi.stubGlobal('window', {
            location: {
                href: 'https://spinnaker.company.com/applications/myapp/pipelineConfig/edit',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe(
            '<a href="https://spinnaker.company.com/applications/myapp/pipelineConfig/edit">Staging Deployment</a>',
        );

        document.body.removeChild(mockConfig);
    });
});
