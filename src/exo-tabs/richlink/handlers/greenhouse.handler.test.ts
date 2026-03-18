import {describe, it, expect, beforeEach} from 'vitest';
import {GreenhouseHandler} from '@exo/exo-tabs/richlink/handlers/greenhouse.handler';

describe('GreenhouseHandler', () => {
    let handler: GreenhouseHandler;

    beforeEach(() => {
        handler = new GreenhouseHandler();
        document.body.innerHTML = '';
    });

    it('should handle Greenhouse URLs', () => {
        expect(handler.canHandle(new URL('https://airtable.greenhouse.io/scorecards/123'))).toBe(
            true,
        );
        expect(handler.canHandle(new URL('https://app.greenhouse.io/people/456'))).toBe(true);
        expect(handler.canHandle(new URL('https://example.com'))).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback).toBe(false);
    });

    it('should format scorecard with candidate name and job title', () => {
        document.body.innerHTML = `
            <div class="hiring-plan">Product Security Engineer</div>
            <h3 class="name"><span>Emmanuel Gambliel</span></h3>
        `;

        const url = 'https://airtable.greenhouse.io/scorecards/51074419002/';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe(
            'Greenhouse: Scorecard: Emmanuel Gambliel (Product Security Engineer)',
        );
    });

    it('should format interview kit with candidate name and job title', () => {
        document.body.innerHTML = `
            <div class="hiring-plan">Software Engineer</div>
            <h3 class="name"><span>Jane Doe</span></h3>
        `;

        const url = 'https://airtable.greenhouse.io/guides/123/people/456';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('Greenhouse: Interview Kit: Jane Doe (Software Engineer)');
    });

    it('should format candidate page with just name', () => {
        document.body.innerHTML = `
            <h3 class="name"><span>John Smith</span></h3>
        `;

        const url = 'https://airtable.greenhouse.io/people/789';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('Greenhouse: Candidate: John Smith');
    });

    it('should format job page with just job title', () => {
        document.body.innerHTML = `
            <div class="hiring-plan">Staff Engineer</div>
        `;

        const url = 'https://airtable.greenhouse.io/plans/101';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('Greenhouse: Job: Staff Engineer');
    });

    it('should fall back to just Greenhouse for unknown paths', () => {
        const url = 'https://airtable.greenhouse.io/dashboard';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('Greenhouse');
    });

    it('should omit name when DOM element is missing', () => {
        document.body.innerHTML = `
            <div class="hiring-plan">Product Security Engineer</div>
        `;

        const url = 'https://airtable.greenhouse.io/scorecards/123/';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('Greenhouse: Scorecard: Product Security Engineer');
    });

    it('should show just page type when DOM is empty', () => {
        const url = 'https://airtable.greenhouse.io/scorecards/123/';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('Greenhouse: Scorecard');
    });

    it('should produce correct text format', () => {
        document.body.innerHTML = `
            <div class="hiring-plan">Product Security Engineer</div>
            <h3 class="name"><span>Emmanuel Gambliel</span></h3>
        `;

        const url = 'https://airtable.greenhouse.io/scorecards/51074419002/';
        const format = handler.getFormats({url})[0];
        expect(format.text).toBe(
            'Greenhouse: Scorecard: Emmanuel Gambliel (Product Security Engineer) (https://airtable.greenhouse.io/scorecards/51074419002/)',
        );
    });
});
