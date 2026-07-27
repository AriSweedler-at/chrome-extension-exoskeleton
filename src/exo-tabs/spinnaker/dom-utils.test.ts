import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {
    getExecutionIdFromUrl,
    findExecutionDetailsLink,
    findPipelineNameForExecution,
} from '@exo/exo-tabs/spinnaker/dom-utils';

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
});

describe('Spinnaker DOM Utils - Element Finding', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('findExecutionDetailsLink', () => {
        it('finds execution details link', () => {
            document.body.innerHTML = `
                <div>
                    <a class="clickable">
                        <span class="small glyphicon glyphicon-chevron-right"></span>
                        Execution Details
                    </a>
                </div>
            `;

            const link = findExecutionDetailsLink();
            expect(link).toBeTruthy();
            expect(link?.textContent).toContain('Execution Details');
        });

        it('returns null when link not found', () => {
            document.body.innerHTML = '<div>No execution details</div>';
            expect(findExecutionDetailsLink()).toBeNull();
        });
    });

    describe('findPipelineNameForExecution', () => {
        const EXEC_ID = '01HPN5GWDEJ5088Y9QZ4JPG2C0';

        it('reads the group title for an execution found by element id', () => {
            document.body.innerHTML = `
                <div class="execution-group">
                    <h4 class="execution-group-title">Blue Green Provisioning PRODUCTION</h4>
                    <div class="execution" id="execution-${EXEC_ID}"></div>
                </div>
            `;
            expect(findPipelineNameForExecution(EXEC_ID)).toBe(
                'Blue Green Provisioning PRODUCTION',
            );
        });

        it('reads the group title for an execution found by permalink href', () => {
            document.body.innerHTML = `
                <div class="execution-group">
                    <h4 class="execution-group-title">Deploy Canary</h4>
                    <div class="execution">
                        <a href="/#/applications/app/executions/${EXEC_ID}">permalink</a>
                    </div>
                </div>
            `;
            expect(findPipelineNameForExecution(EXEC_ID)).toBe('Deploy Canary');
        });

        it('excludes badge children from the pipeline name', () => {
            document.body.innerHTML = `
                <div class="execution-group">
                    <h4 class="execution-group-title">Continuously deploy shared dogfood PRODUCTION<span> <span class="badge">1</span></span></h4>
                    <div class="execution" id="execution-${EXEC_ID}"></div>
                </div>
            `;
            expect(findPipelineNameForExecution(EXEC_ID)).toBe(
                'Continuously deploy shared dogfood PRODUCTION',
            );
        });

        it('picks the right group when several pipelines are listed', () => {
            document.body.innerHTML = `
                <div class="execution-group">
                    <h4 class="execution-group-title">Other Pipeline</h4>
                    <div class="execution" id="execution-OTHER"></div>
                </div>
                <div class="execution-group">
                    <h4 class="execution-group-title">Blue Green Provisioning PRODUCTION</h4>
                    <div class="execution" id="execution-${EXEC_ID}"></div>
                </div>
            `;
            expect(findPipelineNameForExecution(EXEC_ID)).toBe(
                'Blue Green Provisioning PRODUCTION',
            );
        });

        it('falls back to the only group title when the execution node is missing', () => {
            document.body.innerHTML = `
                <div class="execution-group">
                    <h4 class="execution-group-title">Lone Pipeline</h4>
                </div>
            `;
            expect(findPipelineNameForExecution(EXEC_ID)).toBe('Lone Pipeline');
        });

        it('returns null when the execution node is missing and titles are ambiguous', () => {
            document.body.innerHTML = `
                <div class="execution-group"><h4 class="execution-group-title">A</h4></div>
                <div class="execution-group"><h4 class="execution-group-title">B</h4></div>
            `;
            expect(findPipelineNameForExecution(EXEC_ID)).toBeNull();
        });
    });
});
