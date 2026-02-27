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

    it('should format as Spacelift: stack: title with run title', () => {
        const runTitle = document.createElement('h2');
        runTitle.className = 'run-title';
        runTitle.textContent = 'Remove stale references from k8s services (#201431)';
        document.body.appendChild(runTitle);

        const url =
            'https://spacelift.shadowbox.cloud/stack/build_artifacts-production/run/01KJ84Z5SVB5RDZA1TZHZEH33W';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';

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
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';

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
        const format = handler.getFormats({url})[0];
        expect(format.text).toContain('Spacelift: my-stack: Short title');
    });

    it('should show just stack name when no page title', () => {
        const url = 'https://spacelift.shadowbox.cloud/stack/my-stack/run/abc';
        const format = handler.getFormats({url})[0];
        expect(format.text).toContain('Spacelift: my-stack');
    });

    it('should fall back to h1 if no run-title or stack-name element', () => {
        const h1 = document.createElement('h1');
        h1.textContent = 'Dashboard Overview';
        document.body.appendChild(h1);

        const url = 'https://spacelift.shadowbox.cloud/stack/infra-prod';
        const format = handler.getFormats({url})[0];
        expect(format.text).toContain('Spacelift: infra-prod: Dashboard Overview');
    });

    it('should return fallback when no stack in URL and no DOM title', () => {
        const url = 'https://spacelift.shadowbox.cloud/dashboard';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('Spacelift Stack');
    });
});
