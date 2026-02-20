export interface CommandParts {
    flat: string;
    display: string;
}

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
    return OPENSEARCH_DOMAINS.some(domain => url.includes(domain));
}

export function findOpenFlyout(): Element | null {
    for (const selector of FLYOUT_SELECTORS) {
        const el = document.querySelector(selector);
        if (el) return el;
    }
    return null;
}

export function getFieldValue(fieldName: string): string | null {
    const el = document.querySelector(
        `[data-test-subj="tableDocViewRow-${fieldName}-value"]`,
    );
    return el ? el.textContent!.trim() : null;
}

export function buildCommand(): CommandParts | null {
    const hostname =
        getFieldValue('agent.hostname') || getFieldValue('host.hostname');
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
