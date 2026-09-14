import type {EnvironmentInfo} from '@exo/lib/environments';
import {safeUrl} from '@exo/lib/url';
import {queryFirst} from '@exo/lib/dom';

export interface CommandParts {
    flat: string;
    display: string;
}

export const OPENSEARCH_ENVIRONMENTS = ['alpha', 'staging', 'production'] as const;
export type OpenSearchEnvironment = (typeof OPENSEARCH_ENVIRONMENTS)[number];

const HOSTNAME_TO_ENV: Record<string, OpenSearchEnvironment> = {
    'opensearch-applogs.alpha-shadowbox.cloud': 'alpha',
    'opensearch-applogs.staging-shadowbox.cloud': 'staging',
    'opensearch-applogs.shadowbox.cloud': 'production',
};

const ENV_TO_HOSTNAME: Record<OpenSearchEnvironment, string> = {
    alpha: 'opensearch-applogs.alpha-shadowbox.cloud',
    staging: 'opensearch-applogs.staging-shadowbox.cloud',
    production: 'opensearch-applogs.shadowbox.cloud',
};

const OPENSEARCH_DOMAINS = [
    'opensearch-applogs.shadowbox.cloud',
    'opensearch-applogs.staging-shadowbox.cloud',
    'opensearch-applogs.alpha-shadowbox.cloud',
] as const;

const FLYOUT_SELECTORS = [
    '[data-test-subj="osdDocTableDetailsParent"]',
    '[data-test-subj="documentDetailFlyOut"]',
] as const;

export function isOpenSearchPage(url: string): boolean {
    const hostname = safeUrl(url)?.hostname;
    return OPENSEARCH_DOMAINS.some((domain) => hostname === domain);
}

export function findOpenFlyout(): Element | null {
    return queryFirst(FLYOUT_SELECTORS);
}

export function getFieldValue(fieldName: string): string | null {
    const el = document.querySelector(`[data-test-subj="tableDocViewRow-${fieldName}-value"]`);
    return el?.textContent?.trim() ?? null;
}

/** Returns all environments with their URLs and which is current, or undefined if not an OpenSearch page. */
export function getEnvironments(url: string): EnvironmentInfo[] | undefined {
    const hostname = safeUrl(url)?.hostname;
    const currentEnv = hostname ? HOSTNAME_TO_ENV[hostname] : undefined;
    if (!currentEnv) return undefined;

    return OPENSEARCH_ENVIRONMENTS.map((env) => {
        const envUrl = new URL(url);
        envUrl.hostname = ENV_TO_HOSTNAME[env];
        return {env, url: envUrl.toString(), current: env === currentEnv};
    });
}

/** Wraps a value in single quotes, escaping embedded single quotes with the POSIX `'\''` idiom. */
function shellQuote(value: string): string {
    return `'${value.replaceAll("'", `'\\''`)}'`;
}

const SHELL_SAFE = /^[\w./:=-]+$/;

/** Quotes a value only when it contains characters a shell would interpret. */
function shellQuoteIfNeeded(value: string): string {
    return SHELL_SAFE.test(value) ? value : shellQuote(value);
}

export function buildCommand(): CommandParts | null {
    const hostname = getFieldValue('agent.hostname') || getFieldValue('host.hostname');
    if (!hostname) return null;

    const msg = getFieldValue('msg');
    if (!msg) return null;

    const cluster = getFieldValue('kubernetesClusterName');
    const pod = getFieldValue('kubernetesPodName');

    const base = 'grunt admin:log_fetch:fetchMatchingLogMessageFromHost';
    const args: string[] = [`--hostname=${shellQuoteIfNeeded(hostname)}`];
    if (cluster) args.push(`--cluster=${shellQuoteIfNeeded(cluster)}`);
    if (pod) args.push(`--pod=${shellQuoteIfNeeded(pod)}`);
    args.push(`--search=${shellQuote(msg)}`);

    return {
        flat: `${base} ${args.join(' ')}`,
        display: `${base}\n${args.map((a) => `  ${a}`).join('\n')}`,
    };
}
