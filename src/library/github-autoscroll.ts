/**
 * Check if URL is a GitHub PR changes page
 */
export function isGitHubPRChangesPage(url: string): boolean {
    try {
        const urlObj = new URL(url);

        // Check hostname (support both github.com and www.github.com)
        const hostname = urlObj.hostname.toLowerCase();
        if (hostname !== 'github.com' && hostname !== 'www.github.com') {
            return false;
        }

        // Parse pathname (ignoring query params and fragments)
        const pathParts = urlObj.pathname.split('/').filter(part => part !== '');

        // Expected format: owner/repo/pull/{number}/changes
        if (pathParts.length < 5) {
            return false;
        }

        // Check pattern: pathParts[2] === 'pull', pathParts[3] === PR number, pathParts[4] === 'changes'
        const isPullRequest = pathParts[2] === 'pull';
        const prNumber = pathParts[3];
        const isChangesPage = pathParts[4] === 'changes';

        // Validate PR number is purely numeric using regex
        const isPRNumberValid = /^\d+$/.test(prNumber);

        return isPullRequest && isPRNumberValid && isChangesPage;
    } catch {
        // Invalid URL
        return false;
    }
}
