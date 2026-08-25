/**
 * Spinnaker filter-state helpers.
 *
 * Spinnaker (Deck) routes on the hash and encodes execution-view filters as
 * hash query params; the pipeline filter checkboxes are `pipeline=<name>`
 * params (one per checked pipeline). This module is the single owner of
 * reading and writing that state.
 */

import {safeUrl} from '@exo/lib/url';

function getHashQuery(url: URL): URLSearchParams {
    return new URLSearchParams(url.hash.split('?')[1] ?? '');
}

/**
 * Rewrite the hash query through `edit`. Deck reads spaces as %20, not
 * URLSearchParams' `+`, hence the re-encode; an emptied query drops its `?`.
 */
function withHashQuery(url: string, edit: (params: URLSearchParams) => void): string {
    const urlObj = new URL(url);
    const [hashPath, hashQuery = ''] = urlObj.hash.split('?');
    const params = new URLSearchParams(hashQuery);
    edit(params);
    const query = params.toString().replace(/\+/g, '%20');
    urlObj.hash = query ? `${hashPath}?${query}` : hashPath;
    return urlObj.toString();
}

/** Names of all pipelines the view is currently filtered to. */
export function getPipelineFilters(url: string): string[] {
    const urlObj = safeUrl(url);
    return urlObj ? getHashQuery(urlObj).getAll('pipeline') : [];
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
    const segments = safeUrl(url)?.hash.split('?')[0].split('/');
    if (!segments) return null;
    const i = segments.indexOf('applications');
    return i !== -1 && segments[i + 1] ? decodeURIComponent(segments[i + 1]) : null;
}

/** Is this an executions view (the pages where pipeline filters apply)? */
export function isExecutionsView(url: string): boolean {
    return safeUrl(url)?.hash.split('?')[0].includes('/executions') ?? false;
}

/** Is this a stacked execution-details view (.../executions/details/<id>)? */
export function isStackedDetailsView(url: string): boolean {
    return safeUrl(url)?.hash.split('?')[0].includes('/executions/details/') ?? false;
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

// Build an application's executions-list URL isolated to one pipeline: the
// `pipeline` filter is checked and the sidebar search (`q`) is set to the
// same name so the pipeline list narrows to it. Run-scoped state from the
// source URL (execution id, stage/step/details) does not carry over.
export function buildIsolatedPipelineListUrl(
    url: string,
    target: {application: string; pipelineName: string},
): string {
    const urlObj = new URL(url);
    urlObj.hash = `/applications/${target.application}/executions`;
    return withHashQuery(urlObj.toString(), (params) => {
        params.set('q', target.pipelineName);
        params.set('pipeline', target.pipelineName);
    });
}

/**
 * Build the URL that filters the executions view to a single pipeline by
 * setting the `pipeline` param in the hash query. Existing params are
 * preserved; spaces encode as %20.
 */
export function setPipelineFilter(url: string, pipelineName: string): string {
    return withHashQuery(url, (params) => {
        // Delete first: a bare set would update an existing filter in place,
        // while Deck always writes the filter at the end of the query.
        params.delete('pipeline');
        params.set('pipeline', pipelineName);
    });
}

/**
 * Build the URL with every pipeline filter unchecked. Other hash query
 * params are preserved; the `?` is dropped when nothing remains.
 */
export function clearPipelineFilters(url: string): string {
    return withHashQuery(url, (params) => params.delete('pipeline'));
}

/**
 * Rewrite every pipeline filter through `transform`, preserving the other
 * params and the filters' order/multiplicity. URLs without a filter pass
 * through untouched.
 */
export function transformPipelineFilters(url: string, transform: (name: string) => string): string {
    if (getPipelineFilters(url).length === 0) return url;
    return withHashQuery(url, (params) => {
        const pipelines = params.getAll('pipeline');
        params.delete('pipeline');
        pipelines.forEach((name) => params.append('pipeline', transform(name)));
    });
}
