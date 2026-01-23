/**
 * Extract pod names from Spinnaker error messages
 *
 * Searches for Kubernetes metadata in JSON format within error HTML
 * Pattern: "metadata":{"name":"<pod-name>"}
 */

/**
 * Extract all pod names from error HTML containing JSON metadata
 *
 * @param errorHtml - HTML content from error container
 * @returns Array of unique pod names found in the error
 *
 * @example
 * const html = '{"metadata":{"name":"my-pod-123"}}';
 * const pods = extractPodNames(html);
 * // Returns: ['my-pod-123']
 */
export function extractPodNames(errorHtml: string): string[] {
    // Regex pattern to match "metadata":{..."name":"<value>"...}
    // Handles flexible whitespace and additional fields in the metadata object
    const pattern = /"metadata"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/g;

    const podNames: string[] = [];
    let match: RegExpExecArray | null;

    // Extract all matches
    while ((match = pattern.exec(errorHtml)) !== null) {
        const podName = match[1];
        // Only add if not already in the array (deduplicate)
        if (!podNames.includes(podName)) {
            podNames.push(podName);
        }
    }

    return podNames;
}
