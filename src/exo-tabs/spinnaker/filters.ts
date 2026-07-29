/**
 * Spinnaker filter-state helpers.
 *
 * Spinnaker (Deck) routes on the hash and encodes execution-view filters as
 * hash query params; the pipeline filter checkboxes are `pipeline=<name>`
 * params (one per checked pipeline). This module is the single owner of
 * reading and writing that state.
 */

function getHashQuery(url: URL): URLSearchParams {
    return new URLSearchParams(url.hash.split('?')[1] ?? '');
}

/** Names of all pipelines the view is currently filtered to. */
export function getPipelineFilters(url: string): string[] {
    try {
        return getHashQuery(new URL(url)).getAll('pipeline');
    } catch {
        return [];
    }
}

/**
 * The isolated pipeline: the view is filtered to exactly one pipeline
 * (isolation mode, what the 'i' keybinding produces). Null otherwise.
 */
export function getIsolatedPipeline(url: string): string | null {
    const filters = getPipelineFilters(url);
    return filters.length === 1 ? filters[0] : null;
}

/** Application name from an application-scoped URL (#/applications/<app>/...). */
export function getApplicationName(url: string): string | null {
    try {
        const segments = new URL(url).hash.split('?')[0].split('/');
        const i = segments.indexOf('applications');
        return i !== -1 && segments[i + 1] ? decodeURIComponent(segments[i + 1]) : null;
    } catch {
        return null;
    }
}

/** Is this an executions view (the pages where pipeline filters apply)? */
export function isExecutionsView(url: string): boolean {
    try {
        return new URL(url).hash.split('?')[0].includes('/executions');
    } catch {
        return false;
    }
}

/** Is this a stacked execution-details view (.../executions/details/<id>)? */
export function isStackedDetailsView(url: string): boolean {
    try {
        return new URL(url).hash.split('?')[0].includes('/executions/details/');
    } catch {
        return false;
    }
}

/**
 * Build the URL that isolates an execution's pipeline under its own
 * application: hash path /applications/<app>/executions/<id> (no /details/
 * segment), existing hash query preserved, pipeline filter set.
 */
export function buildIsolatedExecutionUrl(
    url: string,
    target: {application: string; executionId: string; pipelineName: string},
): string {
    const urlObj = new URL(url);
    const hashQuery = urlObj.hash.split('?')[1];
    const query = hashQuery ? `?${hashQuery}` : '';
    urlObj.hash = `/applications/${target.application}/executions/${target.executionId}${query}`;
    return setPipelineFilter(urlObj.toString(), target.pipelineName);
}

/**
 * Build the URL that filters the executions view to a single pipeline by
 * setting the `pipeline` param in the hash query. Existing params are
 * preserved; spaces encode as %20.
 */
export function setPipelineFilter(url: string, pipelineName: string): string {
    const urlObj = new URL(url);
    const [hashPath, hashQuery = ''] = urlObj.hash.split('?');
    const params = new URLSearchParams(hashQuery);
    params.delete('pipeline');
    params.set('pipeline', pipelineName);
    urlObj.hash = `${hashPath}?${params.toString().replace(/\+/g, '%20')}`;
    return urlObj.toString();
}

/**
 * Rewrite every pipeline filter through `transform`, preserving the other
 * params and the filters' order/multiplicity. URLs without a filter pass
 * through untouched.
 */
export function transformPipelineFilters(url: string, transform: (name: string) => string): string {
    const urlObj = new URL(url);
    const [hashPath, hashQuery = ''] = urlObj.hash.split('?');
    const params = new URLSearchParams(hashQuery);
    const pipelines = params.getAll('pipeline');
    if (pipelines.length === 0) return url;

    params.delete('pipeline');
    for (const name of pipelines) {
        params.append('pipeline', transform(name));
    }
    urlObj.hash = `${hashPath}?${params.toString().replace(/\+/g, '%20')}`;
    return urlObj.toString();
}
