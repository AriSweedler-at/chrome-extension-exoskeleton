/**
 * Action handlers for Spinnaker tab operations
 *
 * Implements two core actions for interacting with Spinnaker UI:
 * - Toggle execution details
 * - Isolate the open execution's pipeline
 */

import {
    findExecutionDetailsLink,
    getExecutionIdFromUrl,
    findPipelineNameForExecution,
} from '@exo/exo-tabs/spinnaker/dom-utils';
import {setPipelineFilter} from '@exo/exo-tabs/spinnaker/filters';
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
 * Isolate the open execution's pipeline: read the pipeline name from the
 * execution's group heading and set the `pipeline` filter param in the URL,
 * so the executions view shows only that pipeline.
 */
export function isolatePipeline(): void {
    const executionId = getExecutionIdFromUrl();
    if (!executionId) {
        showNotification('No execution found in URL');
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
