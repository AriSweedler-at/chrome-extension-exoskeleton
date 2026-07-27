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
 * The pipeline name is the title element's own text; child elements are
 * badges (e.g. <span><span class="badge">1</span></span>, the running
 * count), not part of the name.
 */
function pipelineNameFromTitle(title: Element | null): string | null {
    if (!title) return null;
    const name = Array.from(title.childNodes)
        .filter((node) => node.nodeType === node.TEXT_NODE)
        .map((node) => node.textContent)
        .join('')
        .trim();
    return name || null;
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
        const name = pipelineNameFromTitle(group.querySelector('.execution-group-title'));
        if (name) return name;
    }

    const titles = document.querySelectorAll('.execution-group-title');
    if (titles.length === 1) {
        return pipelineNameFromTitle(titles[0]);
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
