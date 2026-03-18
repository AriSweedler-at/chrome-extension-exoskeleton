import {describe, it, expect, beforeEach} from 'vitest';
import {GreenhouseHandler} from '@exo/exo-tabs/richlink/handlers/greenhouse.handler';

describe('GreenhouseHandler', () => {
    let handler: GreenhouseHandler;

    beforeEach(() => {
        handler = new GreenhouseHandler();
        document.body.innerHTML = '';
    });

    it('should handle Greenhouse scorecard URLs', () => {
        expect(handler.canHandle(new URL('https://airtable.greenhouse.io/scorecards/123'))).toBe(
            true,
        );
        expect(handler.canHandle(new URL('https://app.greenhouse.io/scorecards/456'))).toBe(true);
    });

    it('should not handle non-scorecard Greenhouse URLs', () => {
        expect(handler.canHandle(new URL('https://airtable.greenhouse.io/people/456'))).toBe(false);
        expect(handler.canHandle(new URL('https://airtable.greenhouse.io/plans/101'))).toBe(false);
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
        expect(format.html).toBe(
            '<a href="https://airtable.greenhouse.io/scorecards/51074419002/">Greenhouse: Scorecard: Emmanuel Gambliel (Product Security Engineer)</a>',
        );
        expect(format.text).toBe(
            'Greenhouse: Scorecard: Emmanuel Gambliel (Product Security Engineer) (https://airtable.greenhouse.io/scorecards/51074419002/)',
        );
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

    it('should show just Greenhouse: Scorecard when DOM is empty', () => {
        const url = 'https://airtable.greenhouse.io/scorecards/123/';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('Greenhouse: Scorecard');
    });
});
