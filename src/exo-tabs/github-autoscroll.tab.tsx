import {TabRegistry} from '@library/popup-exo-tabs/tab-registry';
import {GitHubAutoscrollContent} from '@library/github-autoscroll/GitHubAutoscrollComponent';
import {isGitHubPRChangesPage} from '@library/github-autoscroll';

const GitHubAutoscrollComponent = () => {
    return <GitHubAutoscrollContent />;
};

TabRegistry.register({
    id: 'github-autoscroll',
    label: 'Autoscroll',
    component: GitHubAutoscrollComponent,
    getPriority: (url: string) => {
        if (isGitHubPRChangesPage(url)) {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    },
    enablementToggle: true,
    primaryAction: async (tabId) => {
        const response = await chrome.tabs.sendMessage(tabId, {
            type: 'GITHUB_AUTOSCROLL_TOGGLE',
        });
        return !!response;
    },
});
