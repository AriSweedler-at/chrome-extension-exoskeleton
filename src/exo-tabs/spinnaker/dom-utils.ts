/**
 * Extract execution ID from Spinnaker URL
 * Patterns: /executions/01HPN64GE091GK831P0XG2JQQT
 *           /executions/details/01HPN64GE091GK831P0XG2JQQT (stacked view)
 */
export function getExecutionIdFromUrl(url: string = window.location.href): string | null {
    const match = url.match(/\/executions\/(?:details\/)?([A-Z0-9]+)/);
    return match ? match[1] : null;
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
 * The pipeline name of an execution on a stacked details view: each stacked
 * execution renders its full pipeline name as its .execution-name heading.
 */
export function findStackedPipelineName(executionId: string): string | null {
    const executionEl = document.getElementById(`execution-${executionId}`);
    return pipelineNameFromTitle(executionEl?.querySelector('.execution-name') ?? null);
}

/**
 * Stage panes embed notification-event payloads (copy-to-clipboard widgets
 * and <pre> dumps) — JSON, sometimes JSON-encoded twice — whose
 * aggregation_key is the execution id and whose tags name the application.
 */
function parseEventPayload(raw: string): {aggregation_key?: string; tags?: string[]} | null {
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch {
        return null;
    }
}

/**
 * The application that owns an execution, read from the event payloads on
 * the page ("application:<name>" tag under the execution's aggregation_key).
 * Null when no payload for this execution is rendered.
 */
export function findApplicationForExecution(executionId: string): string | null {
    const payloadElements = document.querySelectorAll('copy-to-clipboard textarea, pre');
    for (const el of Array.from(payloadElements)) {
        const payload = parseEventPayload(el.textContent ?? '');
        if (payload?.aggregation_key !== executionId) continue;

        const tag = payload.tags?.find((t) => t.startsWith('application:'));
        if (tag) return tag.slice('application:'.length);
    }
    return null;
}

/**
 * Find the last stacked-pipeline row on an execution-details view.
 *
 * The stacked view (URL .../executions/details/<id>) renders each pipeline
 * of the stack as a .row containing its .execution inside
 * react-ui-view-adapter[name="pipelines"]; trailing rows hold the selected
 * stage's config pane, not a pipeline.
 */
export function findLastStackedPipelineRow(): HTMLElement | null {
    const adapter = document.querySelector('react-ui-view-adapter[name="pipelines"]');
    if (!adapter) return null;

    const pipelineRows = Array.from(adapter.querySelectorAll('.row')).filter((row) =>
        row.querySelector('.execution'),
    );
    return (pipelineRows[pipelineRows.length - 1] as HTMLElement | undefined) ?? null;
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
