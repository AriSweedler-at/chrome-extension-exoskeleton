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
 * top of its row to the top of the viewport.
 */
export function jumpToLastPipeline(): void {
    const row = findLastStackedPipelineRow();
    if (!row) {
        showNotification('No stacked pipeline rows on this page');
        return;
    }
    row.scrollIntoView({block: 'start'});
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

const EVENT_PANE_POLL_MS = 100;
const EVENT_PANE_POLL_ATTEMPTS = 30;

/**
 * The event payload only renders while its stage's details pane is open:
 * click the execution's Datadog change-event stage marker and poll until the
 * payload (and the application it names) appears.
 */
async function openEventStageAndFindApplication(executionId: string): Promise<string | null> {
    const marker = findEventStageMarker(executionId);
    if (!marker) return null;
    marker.click();

    for (let attempt = 0; attempt < EVENT_PANE_POLL_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, EVENT_PANE_POLL_MS));
        const application = findApplicationForExecution(executionId);
        if (application) return application;
    }
    return null;
}
