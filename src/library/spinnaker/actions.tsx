/**
 * Action handlers for Spinnaker tab operations
 *
 * Implements five core actions for interacting with Spinnaker UI:
 * - Toggle execution details
 * - Display active execution info
 * - Display active stage info
 * - Jump to execution (alias)
 * - Extract pod names from errors
 */

import {
    findExecutionDetailsLink,
    getExecutionIdFromUrl,
    isExecutionOpen,
    getActiveStageFromUrl,
    findErrorContainer,
} from './dom-utils';
import {extractPodNames as extractPodNamesFromHtml} from './pod-extractor';

/**
 * Show a Chrome notification
 */
function showNotification(message: string): void {
    chrome.notifications.create(
        `spinnaker-${Date.now()}`,
        {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon.png'),
            title: 'Spinnaker',
            message,
        },
        () => {
            // Optional callback
        },
    );
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
 * Display information about the currently active stage
 * Shows stage number and details parameter
 */
export function displayActiveStage(): void {
    const stageInfo = getActiveStageFromUrl();
    if (!stageInfo) {
        showNotification('No stage open');
        return;
    }

    showNotification(`Stage ${stageInfo.stage}: ${stageInfo.details}`);
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
        await navigator.clipboard.writeText(firstPodName);
        const message =
            podNames.length === 1
                ? `Copied pod name: ${firstPodName}`
                : `Copied pod name: ${firstPodName} (${podNames.length} total found)`;
        showNotification(message);
    } catch {
        showNotification('Failed to copy pod name to clipboard');
    }
}
