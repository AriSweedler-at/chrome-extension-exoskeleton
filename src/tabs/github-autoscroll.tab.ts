import React from 'react';
import {Component} from '../library/components/base-component';
import {TabRegistry} from '../library/tabs/tab-registry';
import {GitHubAutoscrollContent} from '../components/GitHubAutoscrollComponent';
import {isGitHubPRChangesPage} from '../library/github-autoscroll';

class GitHubAutoscrollComponent extends Component {
    render() {
        return React.createElement(GitHubAutoscrollContent, null);
    }
}

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
});
