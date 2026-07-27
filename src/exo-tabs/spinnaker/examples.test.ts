import {describe, it, expect, afterEach} from 'vitest';
import {
    listExamples,
    loadExampleHtml,
    missingExampleHint,
} from '@exo/exo-tabs/spinnaker/example-dom';
import {
    findPipelineNameForExecution,
    findExecutionDetailsLink,
    findErrorContainer,
} from '@exo/exo-tabs/spinnaker/dom-utils';
import {extractPodNames} from '@exo/exo-tabs/spinnaker/pod-extractor';
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

        it('resolves the owning pipeline for every execution on the page', () => {
            installDom();
            const executions = Array.from(
                document.querySelectorAll('[id^="execution-"]'),
            ) as HTMLElement[];
            expect(executions.length).toBeGreaterThan(0);

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

        it('finds the Execution Details link', () => {
            installDom();
            expect(findExecutionDetailsLink()).not.toBeNull();
        });

        it('extracts at least one pod name when an error alert is present', () => {
            installDom();
            const container = findErrorContainer();
            if (!container) return; // snapshot has no failed stage open — nothing to assert
            expect(extractPodNames(container.innerHTML).length).toBeGreaterThan(0);
        });
    });
});
