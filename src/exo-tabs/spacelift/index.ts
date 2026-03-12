export const SPACELIFT_HOSTNAME = 'spacelift.shadowbox.cloud';
export const ENVIRONMENTS = ['alpha', 'staging', 'production'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

function parseStackName(url: string): string | undefined {
    try {
        const u = new URL(url);
        if (u.hostname !== SPACELIFT_HOSTNAME) return undefined;
        return u.pathname.match(/^\/stack\/([^/]+)/)?.[1];
    } catch {
        return undefined;
    }
}

export function isSpaceliftStackPage(url: string): boolean {
    return parseStackName(url) !== undefined;
}

export interface EnvironmentInfo {
    env: Environment;
    url: string;
    current: boolean;
}

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

/** Returns the URL for the next environment in rotation, or undefined. */
export function getNextEnvironmentUrl(url: string): string | undefined {
    const envs = getEnvironments(url);
    if (!envs) return undefined;
    const currentIdx = envs.findIndex((e) => e.current);
    return envs[(currentIdx + 1) % envs.length].url;
}
