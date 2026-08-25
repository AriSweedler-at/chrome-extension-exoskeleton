export const SPACELIFT_HOSTNAME = 'spacelift.shadowbox.cloud';
export const ENVIRONMENTS = ['alpha', 'staging', 'production'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

import {safeUrl} from '@exo/lib/url';

function parseStackName(url: string): string | undefined {
    const u = safeUrl(url);
    if (u?.hostname !== SPACELIFT_HOSTNAME) return undefined;
    return u.pathname.match(/^\/stack\/([^/]+)/)?.[1];
}

export function isSpaceliftStackPage(url: string): boolean {
    return parseStackName(url) !== undefined;
}

import type {EnvironmentInfo} from '@exo/lib/popup-exo-tabs/environment-ui';
export type {EnvironmentInfo} from '@exo/lib/popup-exo-tabs/environment-ui';

/** Returns all environments with their URLs and which is current, or undefined if not a recognized stack. */
export function getEnvironments(url: string): EnvironmentInfo[] | undefined {
    const stackName = parseStackName(url);
    if (!stackName) return undefined;

    const currentIdx = ENVIRONMENTS.findIndex((env) => stackName.endsWith(`-${env}`));
    if (currentIdx === -1) return undefined;

    const baseName = stackName.slice(0, -(ENVIRONMENTS[currentIdx].length + 1));
    const u = new URL(url);

    return ENVIRONMENTS.map((env, i) => {
        u.pathname = `/stack/${baseName}-${env}`;
        return {env, url: u.toString(), current: i === currentIdx};
    });
}
