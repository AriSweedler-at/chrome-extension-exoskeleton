import {describe, it, expect} from 'vitest';
import {extractPodNames} from '@exo/library/spinnaker/pod-extractor';

describe('pod-extractor', () => {
    describe('extractPodNames', () => {
        it('should extract pod names from error HTML with metadata', () => {
            const errorHtml = `
                <div class="alert alert-danger">
                    Error message with JSON:
                    {"metadata":{"name":"h-bg-provision-step-0-5b8e-jqqt"}}
                </div>
            `;

            const result = extractPodNames(errorHtml);

            expect(result).toEqual(['h-bg-provision-step-0-5b8e-jqqt']);
        });

        it('should extract multiple pod names from error HTML', () => {
            const errorHtml = `
                <div class="alert alert-danger">
                    Multiple errors:
                    {"metadata":{"name":"pod-one-abc123"}}
                    {"metadata":{"name":"pod-two-def456"}}
                </div>
            `;

            const result = extractPodNames(errorHtml);

            expect(result).toEqual(['pod-one-abc123', 'pod-two-def456']);
        });

        it('should handle metadata with whitespace variations', () => {
            const errorHtml = `
                {"metadata"  :  {  "name"  :  "pod-with-spaces-xyz"  }}
            `;

            const result = extractPodNames(errorHtml);

            expect(result).toEqual(['pod-with-spaces-xyz']);
        });

        it('should handle complex nested JSON with metadata', () => {
            const errorHtml = `
                {
                    "kind":"Pod",
                    "metadata":{
                        "name":"complex-pod-name-123",
                        "namespace":"default",
                        "uid":"abc-def-ghi"
                    },
                    "spec":{...}
                }
            `;

            const result = extractPodNames(errorHtml);

            expect(result).toEqual(['complex-pod-name-123']);
        });

        it('should return empty array when no metadata found', () => {
            const errorHtml = `
                <div class="alert alert-danger">
                    Error message without pod names
                </div>
            `;

            const result = extractPodNames(errorHtml);

            expect(result).toEqual([]);
        });

        it('should return empty array for empty string', () => {
            const result = extractPodNames('');

            expect(result).toEqual([]);
        });

        it('should handle metadata without name field', () => {
            const errorHtml = `
                {"metadata":{"namespace":"default","uid":"123"}}
            `;

            const result = extractPodNames(errorHtml);

            expect(result).toEqual([]);
        });

        it('should extract from real-world Spinnaker error format', () => {
            const errorHtml = `
                <div class="alert alert-danger">
                    <strong>Exception</strong>
                    <div>Kubernetes job failed with status: {"kind":"Pod","apiVersion":"v1","metadata":{"name":"hyperbase-job-abc-123","namespace":"production"},"status":{"phase":"Failed"}}</div>
                </div>
            `;

            const result = extractPodNames(errorHtml);

            expect(result).toEqual(['hyperbase-job-abc-123']);
        });

        it('should handle escaped quotes in JSON', () => {
            const errorHtml = `
                Error: {\\"metadata\\":{\\"name\\":\\"escaped-pod-name\\"}}
            `;

            // This won't match because the regex expects actual quotes
            const result = extractPodNames(errorHtml);

            expect(result).toEqual([]);
        });

        it('should deduplicate pod names', () => {
            const errorHtml = `
                {"metadata":{"name":"duplicate-pod"}}
                {"metadata":{"name":"duplicate-pod"}}
                {"metadata":{"name":"different-pod"}}
            `;

            const result = extractPodNames(errorHtml);

            expect(result).toEqual(['duplicate-pod', 'different-pod']);
        });
    });
});
