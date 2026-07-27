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
    // Locate each metadata object, then look for a top-level "name" field
    // within it (nested objects like labels/annotations may precede name)
    const metadataPattern = /"metadata"\s*:\s*\{/g;
    const namePattern = /"name"\s*:\s*"([^"]+)"/;

    const podNames: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = metadataPattern.exec(errorHtml)) !== null) {
        const openBraceIndex = match.index + match[0].length - 1;
        const topLevel = topLevelObjectContent(errorHtml, openBraceIndex);
        const nameMatch = namePattern.exec(topLevel);
        const podName = nameMatch?.[1];
        // Only add if not already in the array (deduplicate)
        if (podName && !podNames.includes(podName)) {
            podNames.push(podName);
        }
    }

    return podNames;
}

/**
 * Collect the characters that sit directly inside the object opening at
 * `openBraceIndex`, skipping the contents of nested objects and tracking
 * string boundaries so braces inside string values don't affect depth.
 */
function topLevelObjectContent(text: string, openBraceIndex: number): string {
    let depth = 0;
    let inString = false;
    let content = '';

    for (let i = openBraceIndex; i < text.length; i++) {
        const char = text[i];
        if (inString) {
            if (char === '\\') {
                if (depth === 1) content += char + (text[i + 1] ?? '');
                i++;
                continue;
            }
            if (char === '"') inString = false;
            if (depth === 1) content += char;
            continue;
        }
        if (char === '"') {
            inString = true;
            if (depth === 1) content += char;
            continue;
        }
        if (char === '{') {
            depth++;
            continue;
        }
        if (char === '}') {
            depth--;
            if (depth === 0) break;
            continue;
        }
        if (depth === 1) content += char;
    }

    return content;
}
