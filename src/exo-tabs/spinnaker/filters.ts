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

/** Is this an executions view (the pages where pipeline filters apply)? */
export function isExecutionsView(url: string): boolean {
    try {
        return new URL(url).hash.split('?')[0].includes('/executions');
    } catch {
        return false;
    }
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
