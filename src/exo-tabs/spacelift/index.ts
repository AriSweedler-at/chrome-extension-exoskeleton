export const SPACELIFT_HOSTNAME = 'spacelift.shadowbox.cloud';
const ENVIRONMENTS = ['alpha', 'staging', 'production'] as const;

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

function findCurrentEnvIndex(stackName: string): number {
    return ENVIRONMENTS.findIndex((env) => stackName.endsWith(`-${env}`));
}

function rotateEnv(url: string, direction: 1 | -1): {env: string; url: string} | undefined {
    const stackName = parseStackName(url);
    if (!stackName) return undefined;

    const i = findCurrentEnvIndex(stackName);
    if (i === -1) return undefined;

    const nextEnv = ENVIRONMENTS[(i + direction + ENVIRONMENTS.length) % ENVIRONMENTS.length];
    const baseName = stackName.slice(0, -(ENVIRONMENTS[i].length + 1));
    const u = new URL(url);
    u.pathname = `/stack/${baseName}-${nextEnv}`;
    return {env: nextEnv, url: u.toString()};
}

export function getAdjacentEnvironments(url: string): {prev: string; next: string} | undefined {
    const prev = rotateEnv(url, -1);
    const next = rotateEnv(url, 1);
    if (!prev || !next) return undefined;
    return {prev: prev.env, next: next.env};
}

export function getNextEnvironmentUrl(url: string): string | undefined {
    return rotateEnv(url, 1)?.url;
}

export function getPrevEnvironmentUrl(url: string): string | undefined {
    return rotateEnv(url, -1)?.url;
}
