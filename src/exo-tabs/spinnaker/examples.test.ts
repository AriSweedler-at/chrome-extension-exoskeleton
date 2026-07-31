import {describe, it, expect, afterEach} from 'vitest';
import {
    listExamples,
    loadExampleHtml,
    missingExampleHint,
} from '@exo/exo-tabs/spinnaker/example-dom';
import {
    findPipelineNameForExecution,
    findExecutionDetailsLink,
    findLastStackedPipelineRow,
    findStackedPipelineName,
    findApplicationForExecution,
    findEventStageMarker,
    findViewPipelineExecutionLink,
    findChildPipelineName,
    findStageLabel,
    findOpenSearchLinks,
    findParentBreadcrumbLink,
    findStageLabelForPipeline,
    getExecutionIdFromUrl,
} from '@exo/exo-tabs/spinnaker/dom-utils';
import {setPipelineFilter} from '@exo/exo-tabs/spinnaker/filters';

/**
 * Real-DOM tests: run the spinnaker DOM helpers against saved snapshots of
 * actual Spinnaker pages (src/exo-tabs/spinnaker/examples/*.html).
 *
 * Snapshots are gitignored — machine-local. When none are saved, this suite
 * skips with a loud hint instead of failing: committed tests must not depend
 * on uncommitted files. The assertions are data-driven (no hardcoded
 * execution ids), so any executions-view snapshot works.
 */

const EXAMPLES = listExamples();

if (EXAMPLES.length === 0) {
    console.warn(
        `[spinnaker real-DOM tests] no snapshots found — suite skipped.\n` +
            missingExampleHint('all-view.spinnaker.html'),
    );
}

const SPINNAKER_URL = 'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions';

describe.skipIf(EXAMPLES.length === 0)('spinnaker helpers against real DOM snapshots', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe.each(EXAMPLES)('%s', (name) => {
        function installDom(): void {
            const html = loadExampleHtml(name);
            if (!html) throw new Error(missingExampleHint(name));
            document.body.innerHTML = html;
        }

        /**
         * Snapshots come in two shapes: executions-list views (have
         * .execution-group) and stacked details views (no groups; pipelines
         * render as .row elements inside the pipelines adapter). Each
         * assertion applies only where its structure exists.
         */
        const isListView = () => document.querySelector('.execution-group') !== null;

        it('resolves the owning pipeline for every grouped execution', () => {
            installDom();
            const executions = Array.from(
                document.querySelectorAll('[id^="execution-"]'),
            ) as HTMLElement[];
            expect(executions.length).toBeGreaterThan(0);
            if (!isListView()) return; // stacked details view — no groups to resolve

            const groupTitles = Array.from(document.querySelectorAll('.execution-group-title')).map(
                (el) => el.textContent?.trim() ?? '',
            );

            for (const el of executions) {
                const executionId = el.id.replace('execution-', '');
                const pipeline = findPipelineNameForExecution(executionId);
                expect(pipeline, `execution ${executionId}`).toBeTruthy();
                // startsWith, not equality: titles may carry badge suffixes
                // (running count) that are not part of the pipeline name.
                expect(groupTitles.some((t) => t.startsWith(pipeline as string))).toBe(true);

                const isolated = setPipelineFilter(SPINNAKER_URL, pipeline as string);
                expect(isolated).toContain('pipeline=');
            }
        });

        it('finds the Execution Details link on executions-list views', () => {
            installDom();
            if (!isListView()) return;
            expect(findExecutionDetailsLink()).not.toBeNull();
        });

        it('finds the last stacked pipeline row where the pipelines adapter exists', () => {
            installDom();
            if (!document.querySelector('react-ui-view-adapter[name="pipelines"] .execution')) {
                return;
            }
            const row = findLastStackedPipelineRow();
            expect(row).not.toBeNull();
            expect(row?.querySelector('.execution')).toBeTruthy();
        });

        it('resolves a pipeline name for every stacked execution', () => {
            installDom();
            if (isListView()) return; // stacked details views only
            const executions = Array.from(
                document.querySelectorAll('[id^="execution-"]'),
            ) as HTMLElement[];
            for (const el of executions) {
                const executionId = el.id.replace('execution-', '');
                expect(
                    findStackedPipelineName(executionId),
                    `execution ${executionId}`,
                ).toBeTruthy();
            }
        });

        it('finds a Datadog change-event stage marker for every stacked execution', () => {
            installDom();
            if (isListView()) return; // stacked details views only
            const executionIds = Array.from(document.querySelectorAll('[id^="execution-"]')).map(
                (el) => el.id.replace('execution-', ''),
            );
            for (const executionId of executionIds) {
                expect(
                    findEventStageMarker(executionId),
                    `execution ${executionId}`,
                ).not.toBeNull();
            }
        });

        it('parses a child execution from any View Pipeline Execution link', () => {
            installDom();
            const link = findViewPipelineExecutionLink();
            if (!link) return; // no child pipeline stage pane open in this snapshot
            const childId = getExecutionIdFromUrl(link.getAttribute('href') ?? '');
            expect(childId).toBeTruthy();
            expect(findChildPipelineName(link)).toBeTruthy();
            // The child is not rendered on the parent page — its element
            // appearing is the composed 'G' action's loaded signal.
            expect(document.getElementById(`execution-${childId}`)).toBeNull();
        });

        it('resolves the nearest-ancestor breadcrumb for executions that have one', () => {
            installDom();
            for (const el of Array.from(document.querySelectorAll('[id^="execution-"]'))) {
                const executionId = el.id.replace('execution-', '');
                const anchors = el.querySelectorAll('.execution-breadcrumbs a');
                const link = findParentBreadcrumbLink(executionId);
                if (anchors.length === 0) {
                    expect(link, `execution ${executionId}`).toBeNull();
                    continue;
                }
                expect(link, `execution ${executionId}`).toBe(anchors[anchors.length - 1]);
                expect(
                    getExecutionIdFromUrl(link?.getAttribute('href') ?? ''),
                    `execution ${executionId}`,
                ).toBeTruthy();
            }
        });

        it('locates the stage that runs an open child pipeline', () => {
            installDom();
            const link = findViewPipelineExecutionLink();
            const childName = link ? findChildPipelineName(link) : null;
            if (!link || !childName) return; // no child pipeline stage pane open
            const owner = link.closest('[id^="execution-"]');
            expect(owner).not.toBeNull();
            const parentId = (owner as HTMLElement).id.replace('execution-', '');
            expect(findStageLabelForPipeline(parentId, childName)).not.toBeNull();
        });

        it('resolves the Monitoring Links stage label wherever one renders', () => {
            installDom();
            // Not every pipeline has a Monitoring Links stage — assert the
            // helper finds the label exactly where the execution renders one.
            for (const el of Array.from(document.querySelectorAll('[id^="execution-"]'))) {
                const executionId = el.id.replace('execution-', '');
                const rendered = Array.from(el.querySelectorAll('.execution-stage-label')).some(
                    (label) => label.textContent?.trim() === 'Monitoring Links',
                );
                expect(
                    Boolean(findStageLabel(executionId, 'Monitoring Links')),
                    `execution ${executionId}`,
                ).toBe(rendered);
            }
        });

        it('collects every OpenSearch link on the page under its execution', () => {
            installDom();
            const isOpenSearch = (a: Element) =>
                /opensearch/i.test(`${a.textContent ?? ''} ${a.getAttribute('href') ?? ''}`);
            const all = Array.from(document.querySelectorAll('a')).filter(isOpenSearch);
            const collected = Array.from(document.querySelectorAll('[id^="execution-"]')).flatMap(
                (el) => findOpenSearchLinks(el.id.replace('execution-', '')),
            );
            expect(new Set(collected)).toEqual(new Set(all));
        });

        it('resolves an application from event payloads when a stage pane is open', () => {
            installDom();
            if (isListView()) return; // stacked details views only
            if (!document.querySelector('copy-to-clipboard')) return; // no stage pane open
            const executionIds = Array.from(document.querySelectorAll('[id^="execution-"]')).map(
                (el) => el.id.replace('execution-', ''),
            );
            const applications = executionIds
                .map((id) => findApplicationForExecution(id))
                .filter(Boolean);
            expect(applications.length).toBeGreaterThan(0);
        });
    });
});
