import {describe, it, expect, beforeEach} from 'vitest';
import {BuildkiteHandler} from '@exo/exo-tabs/richlink/handlers/buildkite.handler';

describe('BuildkiteHandler', () => {
    let handler: BuildkiteHandler;

    beforeEach(() => {
        handler = new BuildkiteHandler();
    });

    it('should handle Buildkite URLs', () => {
        expect(handler.canHandle(new URL('https://buildkite.com/airtable/my-pipeline'))).toBe(true);
        expect(
            handler.canHandle(new URL('https://buildkite.com/airtable/my-pipeline/builds/123')),
        ).toBe(true);
        expect(handler.canHandle(new URL('https://example.com'))).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback).toBe(false);
    });

    it('should extract pipeline name from URL', () => {
        const url = 'https://buildkite.com/airtable/mirror-docker-images-to-devtools';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('BuildKite: mirror-docker-images-to-devtools');
    });

    it('should append build number when present', () => {
        const url =
            'https://buildkite.com/airtable/mirror-docker-images-to-devtools/builds/9681/steps/canvas';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('BuildKite: mirror-docker-images-to-devtools (#9681)');
    });

    it('should strip .airtable suffix from pipeline name', () => {
        const url = 'https://buildkite.com/airtable/my-pipeline.airtable/builds/42';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('BuildKite: my-pipeline (#42)');
    });

    it('should return fallback when URL has no pipeline path', () => {
        const url = 'https://buildkite.com/';
        const format = handler.getFormats({url})[0];
        const linkText = format.html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText).toBe('BuildKite');
    });

    it('should produce correct format with build number', () => {
        const url = 'https://buildkite.com/airtable/deploy-prod/builds/100';
        const format = handler.getFormats({url})[0];
        expect(format.html).toBe(
            '<a href="https://buildkite.com/airtable/deploy-prod/builds/100">BuildKite: deploy-prod (#100)</a>',
        );
        expect(format.text).toBe(
            'BuildKite: deploy-prod (#100) (https://buildkite.com/airtable/deploy-prod/builds/100)',
        );
    });
});
