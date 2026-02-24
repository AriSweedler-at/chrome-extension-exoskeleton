import {describe, it, expect, beforeEach} from 'vitest';
import {BuildkiteHandler} from '@exo/exo-tabs/richlink/handlers/buildkite.handler';

describe('BuildkiteHandler', () => {
    let handler: BuildkiteHandler;

    beforeEach(() => {
        handler = new BuildkiteHandler();
    });

    it('should handle Buildkite URLs', () => {
        expect(handler.canHandle('https://buildkite.com/airtable/my-pipeline')).toBe(true);
        expect(handler.canHandle('https://buildkite.com/airtable/my-pipeline/builds/123')).toBe(
            true,
        );
        expect(handler.canHandle('https://example.com')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback).toBe(false);
    });

    it('should have priority 65', () => {
        expect(handler.priority).toBe(65);
    });

    it('should return "BuildKite Pipeline" as label', () => {
        expect(handler.label).toBe('BuildKite Pipeline');
    });

    it('should extract pipeline name from URL', () => {
        const url = 'https://buildkite.com/airtable/mirror-docker-images-to-devtools';
        expect(handler.extractLinkText({url})).toBe('BuildKite: mirror-docker-images-to-devtools');
    });

    it('should append build number when present', () => {
        const url =
            'https://buildkite.com/airtable/mirror-docker-images-to-devtools/builds/9681/steps/canvas';
        expect(handler.extractLinkText({url})).toBe(
            'BuildKite: mirror-docker-images-to-devtools (#9681)',
        );
    });

    it('should strip .airtable suffix from pipeline name', () => {
        const url = 'https://buildkite.com/airtable/my-pipeline.airtable/builds/42';
        expect(handler.extractLinkText({url})).toBe('BuildKite: my-pipeline (#42)');
    });

    it('should return fallback when URL has no pipeline path', () => {
        const url = 'https://buildkite.com/';
        expect(handler.extractLinkText({url})).toBe('BuildKite');
    });

    it('should produce correct format with build number', () => {
        const url = 'https://buildkite.com/airtable/deploy-prod/builds/100';
        const format = handler.getFormat({url});
        expect(format.html).toBe(
            '<a href="https://buildkite.com/airtable/deploy-prod/builds/100">BuildKite: deploy-prod (#100)</a>',
        );
        expect(format.text).toBe(
            'BuildKite: deploy-prod (#100) (https://buildkite.com/airtable/deploy-prod/builds/100)',
        );
    });
});
