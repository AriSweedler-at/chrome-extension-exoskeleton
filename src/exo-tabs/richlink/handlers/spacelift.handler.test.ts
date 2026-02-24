import {describe, it, expect, beforeEach} from 'vitest';
import {SpaceliftHandler} from '@exo/exo-tabs/richlink/handlers/spacelift.handler';

describe('SpaceliftHandler', () => {
    let handler: SpaceliftHandler;

    beforeEach(() => {
        handler = new SpaceliftHandler();
        document.body.innerHTML = '';
    });

    it('should handle Spacelift URLs', () => {
        expect(handler.canHandle('https://spacelift.shadowbox.cloud/stack/my-stack')).toBe(true);
        expect(handler.canHandle('https://spacelift.shadowbox.cloud/dashboard')).toBe(true);
        expect(handler.canHandle('https://example.com')).toBe(false);
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

    it('should format as Spacelift: stack: title with run title', () => {
        const runTitle = document.createElement('h2');
        runTitle.className = 'run-title';
        runTitle.textContent = 'Remove stale references from k8s services (#201431)';
        document.body.appendChild(runTitle);

        const url =
            'https://spacelift.shadowbox.cloud/stack/build_artifacts-production/run/01KJ84Z5SVB5RDZA1TZHZEH33W';
        const linkText = handler.extractLinkText({url});

        // prefix "Spacelift: build_artifacts-production: " is 40 chars
        expect(linkText.length).toBe(SpaceliftHandler.TOTAL_MAX_LEN);
        expect(linkText).toMatch(/^Spacelift: build_artifacts-production: /);
        expect(linkText).toMatch(/\.\.\.$/);
    });

    it('should truncate so total link text is TOTAL_MAX_LEN chars', () => {
        const runTitle = document.createElement('h2');
        runTitle.className = 'run-title';
        runTitle.textContent = 'This is a very long title that exceeds the limit easily';
        document.body.appendChild(runTitle);

        const url = 'https://spacelift.shadowbox.cloud/stack/my-stack/run/abc';
        const linkText = handler.extractLinkText({url});

        expect(linkText.length).toBe(SpaceliftHandler.TOTAL_MAX_LEN);
        expect(linkText).toMatch(/\.\.\.$/);
        expect(linkText).toMatch(/^Spacelift: my-stack: /);
    });

    it('should not truncate short titles', () => {
        const runTitle = document.createElement('h2');
        runTitle.className = 'run-title';
        runTitle.textContent = 'Short title';
        document.body.appendChild(runTitle);

        const url = 'https://spacelift.shadowbox.cloud/stack/my-stack/run/abc';
        expect(handler.extractLinkText({url})).toBe('Spacelift: my-stack: Short title');
    });

    it('should show just stack name when no page title', () => {
        const url = 'https://spacelift.shadowbox.cloud/stack/my-stack/run/abc';
        expect(handler.extractLinkText({url})).toBe('Spacelift: my-stack');
    });

    it('should fall back to h1 if no run-title or stack-name element', () => {
        const h1 = document.createElement('h1');
        h1.textContent = 'Dashboard Overview';
        document.body.appendChild(h1);

        const url = 'https://spacelift.shadowbox.cloud/stack/infra-prod';
        expect(handler.extractLinkText({url})).toBe('Spacelift: infra-prod: Dashboard Overview');
    });

    it('should return fallback when no stack in URL and no DOM title', () => {
        const url = 'https://spacelift.shadowbox.cloud/dashboard';
        expect(handler.extractLinkText({url})).toBe('Spacelift Stack');
    });
});
