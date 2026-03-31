import {describe, it, expect} from 'vitest';
import {airtableBases} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/known-bases';

describe('known-bases', () => {
    it('should have unique labels', () => {
        const labels = airtableBases.map((b) => b.label);
        expect(new Set(labels).size).toBe(labels.length);
    });

    it('should have unique appIds', () => {
        const appIds = airtableBases.map((b) => b.appId);
        expect(new Set(appIds).size).toBe(appIds.length);
    });

    it('every appId should start with "app"', () => {
        for (const base of airtableBases) {
            expect(base.appId).toMatch(/^app/);
        }
    });

    it('domains should be unique when defined', () => {
        const domains = airtableBases.map((b) => b.domain).filter(Boolean);
        expect(new Set(domains).size).toBe(domains.length);
    });
});
