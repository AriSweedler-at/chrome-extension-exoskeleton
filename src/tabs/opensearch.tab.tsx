import {TabRegistry} from '../library/tabs/tab-registry';
import {OpenSearchComponent} from '../components/OpenSearchComponent';
import {ExtractLogCommandAction, type ExtractLogCommandResult} from '../actions/extract-log-command.action';

export function isOpenSearchPage(url: string): boolean {
    return (
        url.includes('opensearch-applogs.shadowbox.cloud') ||
        url.includes('opensearch-applogs.staging-shadowbox.cloud') ||
        url.includes('opensearch-applogs.alpha-shadowbox.cloud')
    );
}

TabRegistry.register({
    id: 'opensearch',
    label: 'OpenSearch',
    component: OpenSearchComponent,
    getPriority: (url: string) => {
        if (isOpenSearchPage(url)) return 0;
        return Number.MAX_SAFE_INTEGER;
    },
    primaryAction: async (tabId) => {
        const result: ExtractLogCommandResult =
            await ExtractLogCommandAction.sendToTab(tabId, undefined as void);
        return result.success;
    },
});
