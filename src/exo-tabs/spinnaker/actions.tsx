/**
 * Action handlers for Spinnaker tab operations
 *
 * Implements three core actions for interacting with Spinnaker UI:
 * - Toggle execution details
 * - Jump to the last pipeline of a stacked details view
 * - Isolate the open execution's pipeline
 */

import {
    findExecutionDetailsLink,
    findLastStackedPipelineRow,
    findStackedPipelineName,
    getExecutionIdFromUrl,
    findPipelineNameForExecution,
} from '@exo/exo-tabs/spinnaker/dom-utils';
import {
    setPipelineFilter,
    isStackedDetailsView,
    applicationFromPipelineName,
    getApplicationName,
    buildIsolatedExecutionUrl,
} from '@exo/exo-tabs/spinnaker/filters';
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
 * execution's heading; the owning application is derived from the deploy
 * naming convention ("Deploy {service} {ENV}" → {service}), falling back to
 * the current application for non-deploy pipelines.
 */
export function isolatePipeline(): void {
    const executionId = getExecutionIdFromUrl();
    if (!executionId) {
        showNotification('No execution found in URL');
        return;
    }

    if (isStackedDetailsView(window.location.href)) {
        isolateStackedExecution(executionId);
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

function isolateStackedExecution(executionId: string): void {
    const pipelineName = findStackedPipelineName(executionId);
    if (!pipelineName) {
        showNotification('Could not determine the pipeline for this execution');
        return;
    }

    const application =
        applicationFromPipelineName(pipelineName) ?? getApplicationName(window.location.href);
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
