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
