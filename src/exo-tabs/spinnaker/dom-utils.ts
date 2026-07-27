/**
 * Extract execution ID from Spinnaker URL
 * Pattern: /executions/01HPN64GE091GK831P0XG2JQQT
 */
export function getExecutionIdFromUrl(url: string = window.location.href): string | null {
    const match = url.match(/\/executions\/([A-Z0-9]+)/);
    return match ? match[1] : null;
}

/**
 * Check if execution details are open (has stage params)
 */
export function isExecutionOpen(url: string = window.location.href): boolean {
    return url.includes('stage=') && url.includes('details=');
}

/**
 * Find the pipeline name that owns an execution: locate the execution's DOM
 * node, walk up to its .execution-group, and read the group's title. Falls
 * back to the page's only group title when the execution node isn't found
 * (a permalinked execution renders just its own group).
 */
export function findPipelineNameForExecution(executionId: string): string | null {
    const executionEl =
        document.getElementById(`execution-${executionId}`) ??
        document.querySelector(`a[href*="${executionId}"]`);
    const group = executionEl?.closest('.execution-group');
    if (group) {
        const name = group.querySelector('.execution-group-title')?.textContent?.trim();
        if (name) return name;
    }

    const titles = document.querySelectorAll('.execution-group-title');
    if (titles.length === 1) {
        return titles[0].textContent?.trim() || null;
    }
    return null;
}

/**
 * Find the "Execution Details" link in the Spinnaker UI
 */
export function findExecutionDetailsLink(): HTMLElement | null {
    const links = document.querySelectorAll('a.clickable');
    for (const link of Array.from(links)) {
        if (link.textContent?.includes('Execution Details')) {
            return link as HTMLElement;
        }
    }
    return null;
}

/**
 * Find error container within execution details
 */
export function findErrorContainer(): HTMLElement | null {
    const detailsContainer = document.querySelector('.execution-details-container');
    if (!detailsContainer) {
        return null;
    }
    return detailsContainer.querySelector('.alert.alert-danger') as HTMLElement | null;
}
