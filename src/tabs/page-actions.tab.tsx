import {TabRegistry} from '../library/tabs/tab-registry';
import {PageActionsContent} from '../components/PageActionsComponent';

const PageActionsComponent = () => {
    return <PageActionsContent />;
};

TabRegistry.register({
    id: 'page-actions',
    label: 'Page Actions',
    component: PageActionsComponent,
    getPriority: () => 100, // Default priority
});
