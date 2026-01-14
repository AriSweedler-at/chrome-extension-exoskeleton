import React from 'react';
import {Component} from '../library/components/base-component';
import {TabRegistry} from '../library/tabs/tab-registry';
import {PageActionsContent} from '../components/PageActionsComponent';

class PageActionsComponent extends Component {
    render() {
        return React.createElement(PageActionsContent, null);
    }
}

TabRegistry.register({
    id: 'page-actions',
    label: 'Page Actions',
    component: PageActionsComponent,
    getPriority: () => 100, // Default priority
});
