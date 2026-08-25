import {TabRegistry, matchPriority} from '@exo/lib/popup-exo-tabs/tab-registry';
import {GitHubAutoscrollContent} from '@exo/exo-tabs/github-autoscroll/GitHubAutoscrollComponent';
import {isGitHubPRChangesPage} from '@exo/exo-tabs/github-autoscroll';

TabRegistry.register({
    id: 'github-autoscroll',
    label: 'Autoscroll',
    component: GitHubAutoscrollContent,
    getPriority: matchPriority(isGitHubPRChangesPage),
    enablementToggle: true,
    primaryAction: async (tabId) => {
        const response = await chrome.tabs.sendMessage(tabId, {
            type: 'GITHUB_AUTOSCROLL_TOGGLE',
        });
        return !!response;
    },
});
