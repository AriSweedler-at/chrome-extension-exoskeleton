import type {EnvironmentInfo} from '@exo/lib/popup-exo-tabs/environment-ui';

export const SPINNAKER_ENVIRONMENTS = ['alpha', 'production'] as const;
export type SpinnakerEnvironment = (typeof SPINNAKER_ENVIRONMENTS)[number];

const HOSTNAME_TO_ENV: Record<string, SpinnakerEnvironment> = {
    'spinnaker.k8s.shadowbox.cloud': 'production',
    'spinnaker.k8s.alpha-shadowbox.cloud': 'alpha',
};

const ENV_TO_HOSTNAME: Record<SpinnakerEnvironment, string> = {
    production: 'spinnaker.k8s.shadowbox.cloud',
    alpha: 'spinnaker.k8s.alpha-shadowbox.cloud',
};

const SPINNAKER_HOSTNAMES = [
    'spinnaker.k8s.shadowbox.cloud',
    'spinnaker.k8s.alpha-shadowbox.cloud',
] as const;

/**
 * Check if URL is any Spinnaker page
 */
export function isSpinnakerPage(url: string): boolean {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return SPINNAKER_HOSTNAMES.some((h) => hostname === h);
    } catch {
        return false;
    }
}

/**
 * Check if URL is a Spinnaker search page
 */
export function isSpinnakerSearchPage(url: string): boolean {
    try {
        const urlObj = new URL(url);
        if (!isSpinnakerPage(url)) return false;
        return urlObj.hash.startsWith('#/search');
    } catch {
        return false;
    }
}

/** Returns all environments with their URLs and which is current, or undefined if not a Spinnaker page. */
export function getEnvironments(url: string): EnvironmentInfo[] | undefined {
    try {
        const u = new URL(url);
        const currentEnv = HOSTNAME_TO_ENV[u.hostname.toLowerCase()];
        if (!currentEnv) return undefined;

        return SPINNAKER_ENVIRONMENTS.map((env) => {
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
