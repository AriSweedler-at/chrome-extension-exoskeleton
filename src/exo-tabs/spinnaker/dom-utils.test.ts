import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {
    getExecutionIdFromUrl,
    findExecutionDetailsLink,
    findLastStackedPipelineRow,
    findStackedPipelineName,
    findApplicationForExecution,
    findEventStageMarker,
    findPipelineNameForExecution,
    findViewPipelineExecutionLink,
    findChildPipelineName,
    findStageLabel,
    findOpenSearchLinks,
    findParentBreadcrumbLink,
    findStageLabelForPipeline,
    findExecutionRow,
} from '@exo/exo-tabs/spinnaker/dom-utils';

describe('Spinnaker DOM Utils - URL Parsing', () => {
    describe('getExecutionIdFromUrl', () => {
        it('extracts execution ID from URL', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT';
            expect(getExecutionIdFromUrl(url)).toBe('01HPN64GE091GK831P0XG2JQQT');
        });

        it('extracts execution ID from a stacked details URL', () => {
            const url =
                'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/details/01KYQA4SMS5STF94WB38DZY1A4?stage=0';
            expect(getExecutionIdFromUrl(url)).toBe('01KYQA4SMS5STF94WB38DZY1A4');
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

    describe('findViewPipelineExecutionLink', () => {
        it('finds the link among the stage pane anchors by exact text', () => {
            document.body.innerHTML = `
                <div class="stage-details">
                    <a>Pipeline Config</a>
                    <a>Task Status</a>
                    <a href="#/applications/taskworker-service/executions/details/01KYWEXG59VW8KF897QNBXAWRX?stage=0&step=0">
                        View Pipeline Execution
                    </a>
                </div>
            `;
            const link = findViewPipelineExecutionLink();
            expect(link?.getAttribute('href')).toContain('01KYWEXG59VW8KF897QNBXAWRX');
        });

        it('returns null when the selected stage is not a pipeline', () => {
            document.body.innerHTML = `
                <div class="stage-details">
                    <a>Webhook</a>
                    <a>Task Status</a>
                </div>
            `;
            expect(findViewPipelineExecutionLink()).toBeNull();
        });

        it('returns null with no stage pane open', () => {
            expect(findViewPipelineExecutionLink()).toBeNull();
        });
    });

    describe('findChildPipelineName', () => {
        it('reads the Pipeline entry of the pane the link belongs to', () => {
            document.body.innerHTML = `
                <div class="execution-details">
                    <div class="stage-details">
                        <dl>
                            <dt>Application</dt><dd>taskworker-service</dd>
                            <dt>Pipeline</dt><dd>Deploy taskworker-service-data-tbl PRODUCTION</dd>
                            <dt>Status</dt><dd>RUNNING</dd>
                        </dl>
                        <a id="view-link">View Pipeline Execution</a>
                    </div>
                </div>
            `;
            const link = document.getElementById('view-link') as HTMLAnchorElement;
            expect(findChildPipelineName(link)).toBe(
                'Deploy taskworker-service-data-tbl PRODUCTION',
            );
        });

        it('returns null without a Pipeline entry or a pane ancestor', () => {
            document.body.innerHTML = `
                <div class="execution-details">
                    <dl><dt>Status</dt><dd>RUNNING</dd></dl>
                    <a id="in-pane">View Pipeline Execution</a>
                </div>
                <a id="orphan">View Pipeline Execution</a>
            `;
            expect(
                findChildPipelineName(document.getElementById('in-pane') as HTMLAnchorElement),
            ).toBeNull();
            expect(
                findChildPipelineName(document.getElementById('orphan') as HTMLAnchorElement),
            ).toBeNull();
        });
    });

    describe('findParentBreadcrumbLink', () => {
        it('returns the nearest ancestor — the last breadcrumb link', () => {
            document.body.innerHTML = `
                <div class="execution" id="execution-CHILD">
                    <div class="execution-breadcrumbs">
                        Parent Executions:
                        <a href="#/applications/hyperbase-deploy/executions/details/GRANDPARENT?stage=0&step=0">Deploy PRODUCTION</a>
                        <a href="#/applications/hyperbase-deploy/executions/details/PARENT01?stage=0&step=0">K8s Meta Pipeline PRODUCTION</a>
                    </div>
                </div>
            `;
            const link = findParentBreadcrumbLink('CHILD');
            expect(link?.textContent).toBe('K8s Meta Pipeline PRODUCTION');
            expect(link?.getAttribute('href')).toContain('PARENT01');
        });

        it('returns null without breadcrumbs or without the execution', () => {
            document.body.innerHTML = '<div class="execution" id="execution-CHILD"></div>';
            expect(findParentBreadcrumbLink('CHILD')).toBeNull();
            expect(findParentBreadcrumbLink('MISSING')).toBeNull();
        });
    });

    describe('findStageLabelForPipeline', () => {
        const graph = (labels: string) => `
            <div class="execution" id="execution-PARENT01">
                <svg class="pipeline-graph">${labels}</svg>
            </div>
        `;
        const label = (text: string) =>
            `<foreignObject><div class="execution-stage-label clickable"><span>${text}</span></div></foreignObject>`;

        it('matches the stage named for the pipeline target, Deploy/env stripped', () => {
            document.body.innerHTML = graph(
                label('Datadog: Pipeline Started') +
                    label('Run sar-proxy pipeline') +
                    label('Run taskworker-service-data-tbl pipeline'),
            );
            expect(
                findStageLabelForPipeline('PARENT01', 'Deploy sar-proxy PRODUCTION')?.textContent,
            ).toBe('Run sar-proxy pipeline');
        });

        it('returns null when zero or several labels match', () => {
            document.body.innerHTML = graph(
                label('Run sar-proxy pipeline') + label('Run sar-proxy-canary pipeline'),
            );
            expect(findStageLabelForPipeline('PARENT01', 'Deploy sar-proxy PRODUCTION')).toBeNull();
            expect(findStageLabelForPipeline('PARENT01', 'Deploy web-service ALPHA')).toBeNull();
        });
    });

    describe('findExecutionRow', () => {
        it('returns the row the execution renders in', () => {
            document.body.innerHTML = `
                <div class="row" id="the-row"><div class="execution" id="execution-X"></div></div>
            `;
            expect(findExecutionRow('X')?.id).toBe('the-row');
            expect(findExecutionRow('MISSING')).toBeNull();
        });
    });

    describe('findStageLabel', () => {
        it('matches a stage-graph label by exact text, scoped to the execution', () => {
            document.body.innerHTML = `
                <div class="execution" id="execution-OTHER">
                    <div class="execution-stage-label clickable"><span>Monitoring Links</span></div>
                </div>
                <div class="execution" id="execution-MINE">
                    <div class="execution-stage-label clickable"><span>Datadog: Pipeline Started</span></div>
                    <div class="execution-stage-label clickable" id="target"><span>Monitoring Links</span></div>
                </div>
            `;
            expect(findStageLabel('MINE', 'Monitoring Links')?.id).toBe('target');
        });

        it('returns null when no label has that exact text', () => {
            document.body.innerHTML = `
                <div class="execution" id="execution-MINE">
                    <div class="execution-stage-label"><span>Monitoring Links and more</span></div>
                </div>
            `;
            expect(findStageLabel('MINE', 'Monitoring Links')).toBeNull();
            expect(findStageLabel('MISSING', 'Monitoring Links')).toBeNull();
        });
    });

    describe('findOpenSearchLinks', () => {
        it('collects pane links matching OpenSearch by text or host', () => {
            document.body.innerHTML = `
                <div class="execution" id="execution-MINE">
                    <div class="execution-details">
                        <a href="https://opensearch-applogs.shadowbox.cloud/_dashboards/app/discover#/">OpenSearch Link</a>
                        <a href="https://app.datadoghq.com/dashboard">Datadog Dashboard</a>
                        <a>Task Status</a>
                    </div>
                </div>
                <div class="execution" id="execution-OTHER">
                    <div class="execution-details">
                        <a href="https://opensearch-applogs.shadowbox.cloud/">OpenSearch Link</a>
                    </div>
                </div>
            `;
            const links = findOpenSearchLinks('MINE');
            expect(links).toHaveLength(1);
            expect(links[0].getAttribute('href')).toContain('opensearch-applogs');
        });

        it('returns empty without a pane or execution', () => {
            document.body.innerHTML = '<div class="execution" id="execution-MINE"></div>';
            expect(findOpenSearchLinks('MINE')).toEqual([]);
            expect(findOpenSearchLinks('MISSING')).toEqual([]);
        });
    });

    describe('findStackedPipelineName', () => {
        it('reads the execution-name heading of the execution', () => {
            document.body.innerHTML = `
                <div class="execution" id="execution-01KYQA4SMS5STF94WB38DZY1A4">
                    <h4 class="execution-name">Deploy worker-assigner PRODUCTION</h4>
                </div>
            `;
            expect(findStackedPipelineName('01KYQA4SMS5STF94WB38DZY1A4')).toBe(
                'Deploy worker-assigner PRODUCTION',
            );
        });

        it('returns null when the execution or its heading is missing', () => {
            document.body.innerHTML = '<div class="execution" id="execution-OTHER"></div>';
            expect(findStackedPipelineName('MISSING')).toBeNull();
            expect(findStackedPipelineName('OTHER')).toBeNull();
        });
    });

    describe('findEventStageMarker', () => {
        const EXEC_ID = '01KYQA4SMS5STF94WB38DZY1A4';

        it('finds the Datadog change-event stage marker within the execution', () => {
            document.body.innerHTML = `
                <div class="execution" id="execution-${EXEC_ID}">
                    <div class="clickable stage execution-marker stage-type-runjobmanifest"></div>
                    <div class="clickable stage execution-marker stage-type-datadogchangeevent" id="dd-marker"></div>
                </div>
            `;
            expect(findEventStageMarker(EXEC_ID)?.id).toBe('dd-marker');
        });

        it('returns null when the execution has no event stage', () => {
            document.body.innerHTML = `
                <div class="execution" id="execution-${EXEC_ID}">
                    <div class="clickable stage execution-marker stage-type-runjobmanifest"></div>
                </div>
            `;
            expect(findEventStageMarker(EXEC_ID)).toBeNull();
            expect(findEventStageMarker('MISSING')).toBeNull();
        });
    });

    describe('findApplicationForExecution', () => {
        const EXEC_ID = '01KYQA4SMS5STF94WB38DZY1A4';
        const payload = {
            title: '[prod] spinnaker-pipeline: Deploy worker-assigner PRODUCTION started',
            aggregation_key: EXEC_ID,
            tags: ['stage:production', 'application:worker-assigner', 'trigger_type:pipeline'],
        };

        it('reads the application tag from a double-encoded clipboard payload', () => {
            const textarea = document.createElement('textarea');
            textarea.textContent = JSON.stringify(JSON.stringify(payload));
            const widget = document.createElement('copy-to-clipboard');
            widget.appendChild(textarea);
            document.body.appendChild(widget);

            expect(findApplicationForExecution(EXEC_ID)).toBe('worker-assigner');
        });

        it('reads the application tag from a single-encoded <pre> payload', () => {
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(payload, null, 2);
            document.body.appendChild(pre);

            expect(findApplicationForExecution(EXEC_ID)).toBe('worker-assigner');
        });

        it('ignores payloads for other executions', () => {
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify({...payload, aggregation_key: 'OTHER'});
            document.body.appendChild(pre);

            expect(findApplicationForExecution(EXEC_ID)).toBeNull();
        });

        it('tolerates non-JSON payload elements', () => {
            const pre = document.createElement('pre');
            pre.textContent = 'set -euo pipefail\ngrunt deploy';
            document.body.appendChild(pre);

            expect(findApplicationForExecution(EXEC_ID)).toBeNull();
        });
    });

    describe('findLastStackedPipelineRow', () => {
        it('returns the last row containing an execution, skipping config rows', () => {
            document.body.innerHTML = `
                <react-ui-view-adapter name="pipelines" class="ng-scope">
                    <div class="row"><div class="single-execution-details">header</div></div>
                    <div class="row"><div class="execution" id="execution-A">Deploy PRODUCTION</div></div>
                    <div class="row"><div class="execution" id="execution-B">Deploy worker-assigner PRODUCTION</div></div>
                    <div class="row">Webhook Stage Configuration</div>
                </react-ui-view-adapter>
            `;
            const row = findLastStackedPipelineRow();
            expect(row?.querySelector('.execution')?.id).toBe('execution-B');
        });

        it('returns null without the pipelines adapter', () => {
            document.body.innerHTML = `
                <div class="row"><div class="execution" id="execution-A"></div></div>
            `;
            expect(findLastStackedPipelineRow()).toBeNull();
        });

        it('returns null when the adapter has no pipeline rows', () => {
            document.body.innerHTML = `
                <react-ui-view-adapter name="pipelines">
                    <div class="row">just config</div>
                </react-ui-view-adapter>
            `;
            expect(findLastStackedPipelineRow()).toBeNull();
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
