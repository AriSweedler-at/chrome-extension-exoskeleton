/**
 * Action handlers for Spinnaker tab operations
 *
 * Implements the core actions for interacting with Spinnaker UI:
 * - Toggle execution details
 * - Jump to the last pipeline of a stacked details view
 * - Isolate the open execution's pipeline
 * - Jump to hyperbase-deploy's isolated Deploy pipeline
 */

import {
    findExecutionDetailsLink,
    findLastStackedPipelineRow,
    findStackedPipelineName,
    findApplicationForExecution,
    findEventStageMarker,
    findViewPipelineExecutionLink,
    findChildPipelineName,
    findStageLabel,
    findOpenSearchLinks,
    getExecutionIdFromUrl,
    findPipelineNameForExecution,
} from '@exo/exo-tabs/spinnaker/dom-utils';
import {
    setPipelineFilter,
    isStackedDetailsView,
    buildIsolatedExecutionUrl,
    buildIsolatedPipelineListUrl,
    getApplicationName,
} from '@exo/exo-tabs/spinnaker/filters';
import {getSpinnakerEnvironment, environmentToken} from '@exo/exo-tabs/spinnaker/url-match';
import {Notifications} from '@exo/lib/toast-notification';

/**
 * Show a toast notification
 */
function showNotification(message: string): void {
    Notifications.show({message});
}

/**
 * Toggle execution details open/closed
 * Clicks the "Execution Details" link in the UI
 */
export function toggleExecution(): void {
    const link = findExecutionDetailsLink();
    if (link) {
        link.click();
        showNotification('Toggled execution details');
    } else {
        showNotification('Execution details link not found');
    }
}

// The application whose main deploy pipeline is named "Deploy <ENV>".
const DEPLOY_APPLICATION = 'hyperbase-deploy';

// Jump to the current environment's "Deploy <ENV>" pipeline, isolated. Any
// open run is left behind — this targets the pipeline's executions list,
// not a specific execution.
export function isolateDeployPipeline(): void {
    const url = window.location.href;
    if (getApplicationName(url) !== DEPLOY_APPLICATION) {
        showNotification(`Only works in the ${DEPLOY_APPLICATION} application`);
        return;
    }
    const env = getSpinnakerEnvironment(url);
    if (!env) {
        showNotification('Could not determine the Spinnaker environment from the URL');
        return;
    }

    const pipelineName = `Deploy ${environmentToken(env)}`;
    window.location.href = buildIsolatedPipelineListUrl(url, {
        application: DEPLOY_APPLICATION,
        pipelineName,
    });
    showNotification(`Isolated pipeline: ${pipelineName}`);
}

/**
 * Jump to the last pipeline of a stacked execution-details view: scroll the
 * top of its row to the top of the viewport. When the selected stage is a
 * child pipeline (its open pane shows a "View Pipeline Execution" link),
 * open that execution first and scroll once it renders — one keystroke
 * composes both.
 */
export async function jumpToLastPipeline(): Promise<void> {
    const link = findViewPipelineExecutionLink();
    if (!link) {
        scrollToLastPipelineRow();
        return;
    }

    const childId = getExecutionIdFromUrl(link.getAttribute('href') ?? '');
    const childName = findChildPipelineName(link);
    link.click();
    showNotification(
        childName ? `Expanding child pipeline: ${childName}` : 'Expanding child pipeline',
    );
    if (childId && (await waitForExecutionToRender(childId)) && scrollToLastPipelineRow()) {
        showNotification('Jumped to the last pipeline');
    }
}

function scrollToLastPipelineRow(): boolean {
    const row = findLastStackedPipelineRow();
    if (!row) {
        showNotification('No stacked pipeline rows on this page');
        return false;
    }
    row.scrollIntoView({block: 'start'});
    return true;
}

const CHILD_RENDER_POLL_MS = 100;
const CHILD_RENDER_POLL_ATTEMPTS = 50;

// Deck fetches the child execution before rendering its stack — wait for
// its element instead of a fixed delay.
async function waitForExecutionToRender(executionId: string): Promise<boolean> {
    for (let attempt = 0; attempt < CHILD_RENDER_POLL_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, CHILD_RENDER_POLL_MS));
        if (document.getElementById(`execution-${executionId}`)) return true;
    }
    showNotification('The pipeline execution never rendered');
    return false;
}

/**
 * Isolate the open execution's pipeline.
 *
 * On an executions list: read the pipeline name from the execution's group
 * heading and set the `pipeline` filter param, so the view shows only that
 * pipeline.
 *
 * On a stacked details view (.../executions/details/<id>): jump to the
 * execution's own isolated view. The pipeline name comes from the
 * execution's heading; the owning application comes from the event payloads
 * on the page (the only place the DOM names it).
 */
export async function isolatePipeline(): Promise<void> {
    const executionId = getExecutionIdFromUrl();
    if (!executionId) {
        showNotification('No execution found in URL');
        return;
    }

    if (isStackedDetailsView(window.location.href)) {
        await isolateStackedExecution(executionId);
        return;
    }

    const pipelineName = findPipelineNameForExecution(executionId);
    if (!pipelineName) {
        showNotification('Could not determine the pipeline for this execution');
        return;
    }

    window.location.href = setPipelineFilter(window.location.href, pipelineName);
    showNotification(`Isolated pipeline: ${pipelineName}`);
}

async function isolateStackedExecution(executionId: string): Promise<void> {
    const pipelineName = findStackedPipelineName(executionId);
    if (!pipelineName) {
        showNotification('Could not determine the pipeline for this execution');
        return;
    }

    const application =
        findApplicationForExecution(executionId) ??
        (await openEventStageAndFindApplication(executionId));
    if (!application) {
        showNotification('Could not determine the application for this execution');
        return;
    }

    window.location.href = buildIsolatedExecutionUrl(window.location.href, {
        application,
        executionId,
        pipelineName,
    });
    showNotification(`Isolated pipeline: ${pipelineName} (${application})`);
}

const STAGE_PANE_POLL_MS = 100;
const STAGE_PANE_POLL_ATTEMPTS = 30;

/**
 * The event payload only renders while its stage's details pane is open:
 * click the execution's Datadog change-event stage marker and poll until the
 * payload (and the application it names) appears.
 */
async function openEventStageAndFindApplication(executionId: string): Promise<string | null> {
    const marker = findEventStageMarker(executionId);
    if (!marker) return null;
    marker.click();

    for (let attempt = 0; attempt < STAGE_PANE_POLL_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, STAGE_PANE_POLL_MS));
        const application = findApplicationForExecution(executionId);
        if (application) return application;
    }
    return null;
}

const MONITORING_STAGE_LABEL = 'Monitoring Links';

/**
 * Open the execution's OpenSearch links: select its "Monitoring Links"
 * stage (whose pane carries them) and click every OpenSearch link once the
 * pane renders. Links already on the page open without the stage click.
 */
export async function openMonitoringLinks(): Promise<void> {
    const executionId = getExecutionIdFromUrl();
    if (!executionId) {
        showNotification('No execution found in URL');
        return;
    }

    const presentLinks = findOpenSearchLinks(executionId);
    const links = presentLinks.length
        ? presentLinks
        : await openMonitoringStageAndFindLinks(executionId);
    if (!links || links.length === 0) {
        showNotification(`No OpenSearch links found via the ${MONITORING_STAGE_LABEL} stage`);
        return;
    }

    links.forEach((link) => link.click());
    showNotification(`Opened ${links.length} OpenSearch link${links.length === 1 ? '' : 's'}`);
}

async function openMonitoringStageAndFindLinks(
    executionId: string,
): Promise<HTMLAnchorElement[] | null> {
    const label = findStageLabel(executionId, MONITORING_STAGE_LABEL);
    if (!label) return null;
    label.click();

    for (let attempt = 0; attempt < STAGE_PANE_POLL_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, STAGE_PANE_POLL_MS));
        const links = findOpenSearchLinks(executionId);
        if (links.length > 0) return links;
    }
    return null;
}
