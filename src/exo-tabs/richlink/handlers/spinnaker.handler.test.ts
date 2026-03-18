import {describe, it, expect, beforeEach} from 'vitest';
import {
    SpinnakerHandler,
    formatSpinnakerTitle,
} from '@exo/exo-tabs/richlink/handlers/spinnaker.handler';

describe('formatSpinnakerTitle', () => {
    describe('deploy pipelines (Deploy {service} {ENV} {number})', () => {
        it('should format PRODUCTION deploy', () => {
            const result = formatSpinnakerTitle('Deploy internal-tool-service PRODUCTION 1');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy PRODUCTION: internal-tool-service',
            });
        });

        it('should format ALPHA deploy', () => {
            const result = formatSpinnakerTitle('Deploy my-app ALPHA 3');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy ALPHA: my-app',
            });
        });

        it('should format STAGING deploy', () => {
            const result = formatSpinnakerTitle('Deploy foo-bar STAGING 42');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy STAGING: foo-bar',
            });
        });

        it('should handle service names with multiple hyphens', () => {
            const result = formatSpinnakerTitle('Deploy my-cool-service-v2 PRODUCTION 7');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy PRODUCTION: my-cool-service-v2',
            });
        });

        it('should handle multi-word service names', () => {
            const result = formatSpinnakerTitle('Deploy some service name STAGING 1');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy STAGING: some service name',
            });
        });

        it('should handle large execution numbers', () => {
            const result = formatSpinnakerTitle('Deploy api-gateway PRODUCTION 9999');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy PRODUCTION: api-gateway',
            });
        });
    });

    describe('deploy pipeline group (Deploy Pipeline Group {name} {ENV} {number})', () => {
        it('should format PRODUCTION pipeline group deploy', () => {
            const result = formatSpinnakerTitle('Deploy Pipeline Group Support Panel PRODUCTION 3');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy PRODUCTION: Support Panel',
            });
        });

        it('should format ALPHA pipeline group deploy', () => {
            const result = formatSpinnakerTitle('Deploy Pipeline Group My Services ALPHA 1');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy ALPHA: My Services',
            });
        });

        it('should format STAGING pipeline group deploy', () => {
            const result = formatSpinnakerTitle('Deploy Pipeline Group Data Ingestion STAGING 42');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy STAGING: Data Ingestion',
            });
        });

        it('should handle single-word group name', () => {
            const result = formatSpinnakerTitle('Deploy Pipeline Group Infra PRODUCTION 7');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker: deploy PRODUCTION: Infra',
            });
        });
    });

    describe('non-deploy pipelines', () => {
        it('should strip trailing number and prefix with Spinnaker Pipeline:', () => {
            const result = formatSpinnakerTitle('Some Other Pipeline 5');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker Pipeline: Some Other Pipeline',
            });
        });

        it('should handle pipeline name without trailing number', () => {
            const result = formatSpinnakerTitle('My Custom Pipeline');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker Pipeline: My Custom Pipeline',
            });
        });

        it('should handle pipeline name that starts with Deploy but does not match env pattern', () => {
            const result = formatSpinnakerTitle('Deploy to QA 1');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker Pipeline: Deploy to QA',
            });
        });

        it('should handle pipeline with number in the middle but not trailing', () => {
            const result = formatSpinnakerTitle('Build v2 Pipeline');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker Pipeline: Build v2 Pipeline',
            });
        });

        it('should strip only trailing number from non-deploy pipeline', () => {
            const result = formatSpinnakerTitle('Canary Release 12');
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker Pipeline: Canary Release',
            });
        });
    });

    describe('fallback title', () => {
        it('should return Spinnaker Page as-is (no prefix)', () => {
            const result = formatSpinnakerTitle(null);
            expect(result).toEqual({
                label: 'Spinnaker Pipeline',
                title: 'Spinnaker Page',
            });
        });
    });
});

describe('SpinnakerHandler', () => {
    let handler: SpinnakerHandler;

    beforeEach(() => {
        handler = new SpinnakerHandler();
    });

    it('should handle Spinnaker URLs', () => {
        expect(
            handler.canHandle(
                new URL('https://spinnaker.k8s.shadowbox.cloud/#/applications/myapp/executions'),
            ),
        ).toBe(true);
        expect(
            handler.canHandle(
                new URL(
                    'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/myapp/executions',
                ),
            ),
        ).toBe(true);
        expect(handler.canHandle(new URL('https://example.com'))).toBe(false);
        // Buildkite pipeline with "spinnaker" in its name should NOT match
        expect(
            handler.canHandle(
                new URL(
                    'https://buildkite.com/airtable/update-spinnaker-deploy-code-container-sha/builds/69',
                ),
            ),
        ).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback).toBe(false);
    });

    it('should format deploy pipeline from DOM', () => {
        const el = document.createElement('h3');
        el.className = 'execution-group-title';
        el.textContent = 'Deploy internal-tool-service PRODUCTION 1';
        document.body.appendChild(el);

        const url =
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/internal-tool-service/executions/01KM0S3TAN23A4NWAF8BRSKMTP';
        const format = handler.getFormats({url})[0];
        expect(format.label).toBe('Spinnaker Pipeline');
        expect(format.html).toBe(
            `<a href="${url}">Spinnaker: deploy PRODUCTION: internal-tool-service</a>`,
        );
        expect(format.text).toBe(`Spinnaker: deploy PRODUCTION: internal-tool-service (${url})`);

        document.body.removeChild(el);
    });

    it('should format non-deploy pipeline from DOM', () => {
        const el = document.createElement('h3');
        el.className = 'execution-group-title';
        el.textContent = 'Canary Release 5';
        document.body.appendChild(el);

        const url = 'https://spinnaker.k8s.shadowbox.cloud/#/applications/myapp/executions';
        const format = handler.getFormats({url})[0];
        expect(format.html).toBe(`<a href="${url}">Spinnaker Pipeline: Canary Release</a>`);
        expect(format.text).toBe(`Spinnaker Pipeline: Canary Release (${url})`);

        document.body.removeChild(el);
    });

    it('should handle missing pipeline name (fallback)', () => {
        const url = 'https://spinnaker.company.com/applications/myapp';
        const format = handler.getFormats({url})[0];
        expect(format.html).toBe(`<a href="${url}">Spinnaker Page</a>`);
    });

    it('should extract application name if pipeline name not found', () => {
        const mockAppName = document.createElement('h2');
        mockAppName.className = 'application-header';
        mockAppName.textContent = 'my-service';
        document.body.appendChild(mockAppName);

        const url = 'https://spinnaker.company.com/applications/myapp';
        const format = handler.getFormats({url})[0];
        expect(format.html).toBe(`<a href="${url}">Spinnaker Pipeline: my-service</a>`);

        document.body.removeChild(mockAppName);
    });

    it('should extract execution details', () => {
        const mockExecution = document.createElement('div');
        mockExecution.className = 'execution-name';
        mockExecution.textContent = 'Build #42';
        document.body.appendChild(mockExecution);

        const url = 'https://spinnaker.company.com/applications/myapp/executions/details/exec123';
        const format = handler.getFormats({url})[0];
        expect(format.html).toBe(`<a href="${url}">Spinnaker Pipeline: Build #42</a>`);

        document.body.removeChild(mockExecution);
    });

    it('should handle pipeline config page', () => {
        const mockConfig = document.createElement('h4');
        mockConfig.className = 'pipeline-config-name';
        mockConfig.textContent = 'Staging Deployment';
        document.body.appendChild(mockConfig);

        const url = 'https://spinnaker.company.com/applications/myapp/pipelineConfig/edit';
        const format = handler.getFormats({url})[0];
        expect(format.html).toBe(`<a href="${url}">Spinnaker Pipeline: Staging Deployment</a>`);

        document.body.removeChild(mockConfig);
    });
});
