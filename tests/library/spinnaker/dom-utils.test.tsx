import {describe, it, expect} from 'vitest';
import {
    getExecutionIdFromUrl,
    isExecutionOpen,
    getActiveStageFromUrl,
} from '../../../src/library/spinnaker/dom-utils';

describe('Spinnaker DOM Utils - URL Parsing', () => {
    describe('getExecutionIdFromUrl', () => {
        it('extracts execution ID from URL', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT';
            expect(getExecutionIdFromUrl(url)).toBe('01HPN64GE091GK831P0XG2JQQT');
        });

        it('returns null for URL without execution ID', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions';
            expect(getExecutionIdFromUrl(url)).toBeNull();
        });
    });

    describe('isExecutionOpen', () => {
        it('returns true when URL has stage params', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT?stage=2&step=0&details=runJobConfig';
            expect(isExecutionOpen(url)).toBe(true);
        });

        it('returns false when URL has no stage params', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT';
            expect(isExecutionOpen(url)).toBe(false);
        });
    });

    describe('getActiveStageFromUrl', () => {
        it('extracts stage info from URL', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT?stage=2&step=0&details=runJobConfig';
            const result = getActiveStageFromUrl(url);
            expect(result).toEqual({
                stage: 2,
                step: 0,
                details: 'runJobConfig',
            });
        });

        it('returns null when no stage params present', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT';
            expect(getActiveStageFromUrl(url)).toBeNull();
        });

        it('returns null for malformed URLs', () => {
            expect(getActiveStageFromUrl('not-a-url')).toBeNull();
        });

        it('returns null when stage is non-numeric', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions/01HPN64GE091GK831P0XG2JQQT?stage=abc&step=0&details=config';
            expect(getActiveStageFromUrl(url)).toBeNull();
        });

        it('returns null when step is non-numeric', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions/01HPN64GE091GK831P0XG2JQQT?stage=2&step=xyz&details=config';
            expect(getActiveStageFromUrl(url)).toBeNull();
        });
    });
});
