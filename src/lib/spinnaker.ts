/**
 * Check if URL is a Spinnaker search page
 */
export function isSpinnakerSearchPage(url: string): boolean {
    try {
        const urlObj = new URL(url);

        // Check hostname
        const hostname = urlObj.hostname.toLowerCase();
        const validHostnames = [
            'spinnaker.k8s.shadowbox.cloud',
            'spinnaker.k8s.alpha-shadowbox.cloud',
        ];

        if (!validHostnames.includes(hostname)) {
            return false;
        }

        // Check hash contains /search
        return urlObj.hash.startsWith('#/search');
    } catch {
        // Invalid URL
        return false;
    }
}
