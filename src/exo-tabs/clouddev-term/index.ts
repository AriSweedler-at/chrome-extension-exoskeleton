/**
 * Clouddev terminal shared utilities.
 */

export function isClouddevTermPage(url: string): boolean {
    try {
        const hostname = new URL(url).hostname;
        return hostname.endsWith('-term.clouddev.hyperbasedev.com');
    } catch {
        return false;
    }
}
