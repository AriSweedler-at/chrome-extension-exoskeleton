/**
 * Action handlers for Spinnaker tab operations
 *
 * Implements five core actions for interacting with Spinnaker UI:
 * - Toggle execution details
 * - Display active execution info
 * - Isolate the open execution's pipeline
 * - Jump to execution (alias)
 * - Extract pod names from errors
 */

import {
    findExecutionDetailsLink,
    getExecutionIdFromUrl,
    isExecutionOpen,
    findErrorContainer,
    findPipelineNameForExecution,
} from '@exo/exo-tabs/spinnaker/dom-utils';
import {setPipelineFilter} from '@exo/exo-tabs/spinnaker/filters';
import {extractPodNames as extractPodNamesFromHtml} from '@exo/exo-tabs/spinnaker/pod-extractor';
import {Clipboard} from '@exo/lib/clipboard';
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
 * Display information about the currently active execution
 * Shows execution ID and whether it's open or closed
 */
export function displayActiveExecution(): void {
    const executionId = getExecutionIdFromUrl();
    if (!executionId) {
        showNotification('No execution found in URL');
        return;
    }

    const isOpen = isExecutionOpen();
    const status = isOpen ? 'open' : 'closed';
    showNotification(`Execution: ${executionId} (${status})`);
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

/**
 * Jump to execution details
 * Alias for toggleExecution() with semantic clarity
 */
export function jumpToExecution(): void {
    toggleExecution();
}

/**
 * Extract pod names from error messages
 * Finds error container, extracts pod names, and copies first to clipboard
 */
export async function extractPodNames(): Promise<void> {
    const errorContainer = findErrorContainer();
    if (!errorContainer) {
        showNotification('No error container found');
        return;
    }

    const errorHtml = errorContainer.innerHTML;
    const podNames = extractPodNamesFromHtml(errorHtml);

    if (podNames.length === 0) {
        showNotification('No pod names found in error');
        return;
    }

    // Copy first pod name to clipboard
    const firstPodName = podNames[0];
    try {
        await Clipboard.write(firstPodName);
        const message =
            podNames.length === 1
                ? `Copied pod name: ${firstPodName}`
                : `Copied pod name: ${firstPodName} (${podNames.length} total found)`;
        showNotification(message);
    } catch {
        showNotification('Failed to copy pod name to clipboard');
    }
}
