import type {EnvironmentInfo} from '@exo/lib/popup-exo-tabs/environment-ui';

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
    try {
        const hostname = new URL(url).hostname;
        return OPENSEARCH_DOMAINS.some((domain) => hostname === domain);
    } catch {
        return false;
    }
}

export function findOpenFlyout(): Element | null {
    for (const selector of FLYOUT_SELECTORS) {
        const el = document.querySelector(selector);
        if (el) return el;
    }
    return null;
}

export function getFieldValue(fieldName: string): string | null {
    const el = document.querySelector(`[data-test-subj="tableDocViewRow-${fieldName}-value"]`);
    return el?.textContent?.trim() ?? null;
}

/** Returns all environments with their URLs and which is current, or undefined if not an OpenSearch page. */
export function getEnvironments(url: string): EnvironmentInfo[] | undefined {
    try {
        const u = new URL(url);
        const currentEnv = HOSTNAME_TO_ENV[u.hostname];
        if (!currentEnv) return undefined;

        return OPENSEARCH_ENVIRONMENTS.map((env) => {
            const envUrl = new URL(url);
            envUrl.hostname = ENV_TO_HOSTNAME[env];
            return {env, url: envUrl.toString(), current: env === currentEnv};
        });
    } catch {
        return undefined;
    }
}

/** Returns the URL for the next environment in rotation, or undefined. */
export function getNextEnvironmentUrl(url: string): string | undefined {
    const envs = getEnvironments(url);
    if (!envs) return undefined;
    const currentIdx = envs.findIndex((e) => e.current);
    return envs[(currentIdx + 1) % envs.length].url;
}

export function buildCommand(): CommandParts | null {
    const hostname = getFieldValue('agent.hostname') || getFieldValue('host.hostname');
    if (!hostname) return null;

    const msg = getFieldValue('msg');
    if (!msg) return null;

    const cluster = getFieldValue('kubernetesClusterName');
    const pod = getFieldValue('kubernetesPodName');

    const base = 'grunt admin:log_fetch:fetchMatchingLogMessageFromHost';
    const args: string[] = [`--hostname=${hostname}`];
    if (cluster) args.push(`--cluster=${cluster}`);
    if (pod) args.push(`--pod=${pod}`);
    args.push(`--search='${msg}'`);

    return {
        flat: `${base} ${args.join(' ')}`,
        display: `${base}\n${args.map((a) => `  ${a}`).join('\n')}`,
    };
}
