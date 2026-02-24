import {describe, it, expect, beforeEach, vi} from 'vitest';
import {SpaceliftHandler} from '@exo/exo-tabs/richlink/handlers/spacelift.handler';

describe('SpaceliftHandler', () => {
    let handler: SpaceliftHandler;

    beforeEach(() => {
        handler = new SpaceliftHandler();
    });

    it('should handle Spacelift URLs', () => {
        expect(handler.canHandle('https://spacelift.shadowbox.cloud/stack/my-stack')).toBe(true);
        expect(handler.canHandle('https://spacelift.shadowbox.cloud/dashboard')).toBe(true);
        expect(handler.canHandle('https://example.com')).toBe(false);
        expect(handler.canHandle('https://spacelift.io/dashboard')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback).toBe(false);
    });

    it('should have priority 60', () => {
        expect(handler.priority).toBe(60);
    });

    it('should return "Spacelift Stack" as label', () => {
        expect(handler.label).toBe('Spacelift Stack');
    });

    it('should extract stack name from Spacelift page', async () => {
        // Mock Spacelift page DOM with stack name
        const mockStackName = document.createElement('h1');
        mockStackName.className = 'stack-name';
        mockStackName.textContent = 'production-infrastructure';
        document.body.appendChild(mockStackName);

        vi.stubGlobal('window', {
            location: {
                href: 'https://company.app.spacelift.io/stack/prod-infra',
            },
        });

        const html = handler.getFormat().html;
        expect(html).toBe(
            '<a href="https://company.app.spacelift.io/stack/prod-infra">production-infrastructure</a>',
        );

        const text = handler.getFormat().text;
        expect(text).toBe(
            'production-infrastructure (https://company.app.spacelift.io/stack/prod-infra)',
        );

        document.body.removeChild(mockStackName);
    });

    it('should handle missing stack name', async () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://company.app.spacelift.io/stack/my-stack',
            },
        });

        const html = handler.getFormat().html;
        expect(html).toBe(
            '<a href="https://company.app.spacelift.io/stack/my-stack">Spacelift Stack</a>',
        );
    });

    it('should extract run details', async () => {
        const mockRunName = document.createElement('h2');
        mockRunName.className = 'run-title';
        mockRunName.textContent = 'Run #123: Update VPC';
        document.body.appendChild(mockRunName);

        vi.stubGlobal('window', {
            location: {
                href: 'https://company.app.spacelift.io/stack/my-stack/run/123',
            },
        });

        const html = handler.getFormat().html;
        expect(html).toBe(
            '<a href="https://company.app.spacelift.io/stack/my-stack/run/123">Run #123: Update VPC</a>',
        );

        document.body.removeChild(mockRunName);
    });

    it('should extract module name', async () => {
        const mockModuleName = document.createElement('h1');
        mockModuleName.setAttribute('data-testid', 'module-name');
        mockModuleName.textContent = 'terraform-aws-vpc';
        document.body.appendChild(mockModuleName);

        vi.stubGlobal('window', {
            location: {
                href: 'https://company.app.spacelift.io/module/terraform-aws-vpc',
            },
        });

        const html = handler.getFormat().html;
        expect(html).toBe(
            '<a href="https://company.app.spacelift.io/module/terraform-aws-vpc">terraform-aws-vpc</a>',
        );

        document.body.removeChild(mockModuleName);
    });

    it('should extract policy name', async () => {
        const mockPolicyName = document.createElement('h1');
        mockPolicyName.className = 'policy-header';
        mockPolicyName.textContent = 'Require Approval Policy';
        document.body.appendChild(mockPolicyName);

        vi.stubGlobal('window', {
            location: {
                href: 'https://company.app.spacelift.io/policies/approval-policy',
            },
        });

        const html = handler.getFormat().html;
        expect(html).toBe(
            '<a href="https://company.app.spacelift.io/policies/approval-policy">Require Approval Policy</a>',
        );

        document.body.removeChild(mockPolicyName);
    });

    it('should handle page title as fallback', async () => {
        const mockTitle = document.createElement('h1');
        mockTitle.textContent = 'Dashboard Overview';
        document.body.appendChild(mockTitle);

        vi.stubGlobal('window', {
            location: {
                href: 'https://company.app.spacelift.io/dashboard',
            },
        });

        const html = handler.getFormat().html;
        expect(html).toBe(
            '<a href="https://company.app.spacelift.io/dashboard">Dashboard Overview</a>',
        );

        document.body.removeChild(mockTitle);
    });
});
