import {TabRegistry, matchPriority} from '@exo/lib/popup-exo-tabs/tab-registry';
import {GitHubAutoscrollContent} from '@exo/exo-tabs/github-autoscroll/GitHubAutoscrollComponent';
import {isGitHubPRChangesPage} from '@exo/exo-tabs/github-autoscroll';

TabRegistry.register({
    id: 'github-autoscroll',
    label: 'Autoscroll',
    component: GitHubAutoscrollContent,
    getPriority: matchPriority(isGitHubPRChangesPage),
    enablementToggle: true,
});
