#!/usr/bin/env node
/**
 * Inspect a saved Spinnaker DOM snapshot with the spinnaker tab's helpers.
 *
 * The iteration loop for spinnaker DOM logic: save real DOM, point this at
 * it, see exactly what every helper resolves — no browser needed.
 *
 * Usage: npm run spinnaker-html <htmlFile> [url]
 *
 * htmlFile: absolute/relative path, or a bare filename resolved from
 *           src/exo-tabs/spinnaker/examples/
 * url:      the page URL to simulate (affects isolate URLs and the richlink
 *           verdict); defaults to a production executions view.
 */

import {JSDOM} from 'jsdom';

import {
    resolveExamplePath,
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
import {
    getPipelineFilters,
    getIsolatedPipeline,
    setPipelineFilter,
} from '@exo/exo-tabs/spinnaker/filters';
import {SpinnakerHandler} from '@exo/exo-tabs/richlink/handlers/spinnaker.handler';

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: npm run spinnaker-html <htmlFile> [url]');
    console.log('');
    console.log('htmlFile: absolute/relative path, or a bare filename from examples/');
    const examples = listExamples();
    if (examples.length > 0) {
        console.log('');
        console.log('Saved snapshots:');
        examples.forEach((f) => console.log(`  - ${f}`));
    } else {
        console.log('');
        console.log(missingExampleHint('<name>.html'));
    }
    process.exit(1);
}

const [htmlFile, urlArg] = args;
const url = urlArg || 'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions';

const html = loadExampleHtml(htmlFile);
if (html === null) {
    console.error(missingExampleHint(htmlFile));
    process.exit(1);
}

const dom = new JSDOM(html, {url: url.split('#')[0], runScripts: 'outside-only'});
(global as Record<string, unknown>).document = dom.window.document;
(global as Record<string, unknown>).window = dom.window;

console.log('\n=== Spinnaker DOM inspection ===');
console.log(`File: ${resolveExamplePath(htmlFile)}`);
console.log(`URL:  ${url}`);

const filters = getPipelineFilters(url);
console.log(`\nPipeline filters in URL: ${filters.length ? filters.join(', ') : '(none)'}`);
console.log(`Isolation mode: ${getIsolatedPipeline(url) ?? 'NO'}`);

const groupTitles = Array.from(dom.window.document.querySelectorAll('.execution-group-title'));
console.log(`\nExecution groups (${groupTitles.length}):`);
groupTitles.slice(0, 10).forEach((el) => console.log(`  - ${el.textContent?.trim()}`));
if (groupTitles.length > 10) console.log(`  ... and ${groupTitles.length - 10} more`);

const executions = Array.from(
    dom.window.document.querySelectorAll('[id^="execution-"]'),
) as HTMLElement[];
console.log(`\nExecutions (${executions.length}):`);
for (const el of executions) {
    const executionId = el.id.replace('execution-', '');
    const pipeline = findPipelineNameForExecution(executionId);
    console.log(`  - ${executionId}`);
    console.log(`      pipeline:    ${pipeline ?? 'NOT FOUND'}`);
    if (pipeline) {
        console.log(`      isolate url: ${setPipelineFilter(url, pipeline)}`);
    }
}

const detailsLink = findExecutionDetailsLink();
console.log(`\nExecution Details link ('e'): ${detailsLink ? 'found' : 'NOT FOUND'}`);

const errorContainer = findErrorContainer();
if (errorContainer) {
    const pods = extractPodNames(errorContainer.innerHTML);
    console.log(`Error container ('p'): found, ${pods.length} pod name(s):`);
    pods.forEach((p) => console.log(`  - ${p}`));
} else {
    console.log(`Error container ('p'): none (no failed stage open in this snapshot)`);
}

console.log('\nRich link (Cmd+Shift+C) formats:');
const linkFormats = new SpinnakerHandler().getFormats({url});
if (linkFormats.length === 0) {
    console.log('  (none — spinnaker handler contributes nothing for this URL)');
}
for (const format of linkFormats) {
    console.log(`  - [${format.label}] ${format.text}`);
}
console.log('');
