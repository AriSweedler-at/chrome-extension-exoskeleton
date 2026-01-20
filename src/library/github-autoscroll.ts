/**
 * Check if URL is a GitHub PR changes page
 */
export function isGitHubPRChangesPage(url: string): boolean {
    const parts = url.split('/');
    return (
        parts[2] === 'github.com' &&
        parts.length >= 8 &&
        parts[5] === 'pull' &&
        !isNaN(parseInt(parts[6])) &&
        parts[7] === 'changes'
    );
}
