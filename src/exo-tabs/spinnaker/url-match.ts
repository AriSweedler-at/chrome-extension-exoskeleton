import type {EnvironmentInfo} from '@exo/lib/environments';
import {transformPipelineFilters} from '@exo/exo-tabs/spinnaker/filters';
import {safeUrl} from '@exo/lib/url';

export const SPINNAKER_ENVIRONMENTS = ['alpha', 'staging', 'production'] as const;
export type SpinnakerEnvironment = (typeof SPINNAKER_ENVIRONMENTS)[number];

const HOSTNAME_TO_ENV: Record<string, SpinnakerEnvironment> = {
    'spinnaker.k8s.shadowbox.cloud': 'production',
    'spinnaker.k8s.staging-shadowbox.cloud': 'staging',
    'spinnaker.k8s.alpha-shadowbox.cloud': 'alpha',
};

const ENV_TO_HOSTNAME: Record<SpinnakerEnvironment, string> = {
    production: 'spinnaker.k8s.shadowbox.cloud',
    staging: 'spinnaker.k8s.staging-shadowbox.cloud',
    alpha: 'spinnaker.k8s.alpha-shadowbox.cloud',
};

/** The environment token embedded in pipeline names ("Deploy web PRODUCTION"). */
const ENV_TO_TOKEN: Record<SpinnakerEnvironment, string> = {
    production: 'PRODUCTION',
    staging: 'STAGING',
    alpha: 'ALPHA',
};

const ENV_TOKEN_PATTERN = /\b(ALPHA|STAGING|PRODUCTION)\b/g;

/** The environment the URL's hostname belongs to, or undefined. */
export function getSpinnakerEnvironment(url: string): SpinnakerEnvironment | undefined {
    const hostname = safeUrl(url)?.hostname.toLowerCase();
    return hostname ? HOSTNAME_TO_ENV[hostname] : undefined;
}

export function environmentToken(env: SpinnakerEnvironment): string {
    return ENV_TO_TOKEN[env];
}

/**
 * Check if URL is any Spinnaker page
 */
export function isSpinnakerPage(url: string): boolean {
    return getSpinnakerEnvironment(url) !== undefined;
}

/**
 * Check if URL is a Spinnaker search page
 */
export function isSpinnakerSearchPage(url: string): boolean {
    return isSpinnakerPage(url) && (safeUrl(url)?.hash.startsWith('#/search') ?? false);
}

/** Returns all environments with their URLs and which is current, or undefined if not a Spinnaker page. */
export function getEnvironments(url: string): EnvironmentInfo[] | undefined {
    const currentEnv = getSpinnakerEnvironment(url);
    if (!currentEnv) return undefined;

    return SPINNAKER_ENVIRONMENTS.map((env) => {
        const envUrl = new URL(url);
        envUrl.hostname = ENV_TO_HOSTNAME[env];
        const current = env === currentEnv;
        // Pipeline names embed the environment ("Deploy web PRODUCTION"),
        // so retarget any pipeline filter to the destination env's token.
        const envUrlWithFilters = current
            ? envUrl.toString()
            : transformPipelineFilters(envUrl.toString(), (name) =>
                  name.replace(ENV_TOKEN_PATTERN, ENV_TO_TOKEN[env]),
              );
        return {env, url: envUrlWithFilters, current};
    });
}
