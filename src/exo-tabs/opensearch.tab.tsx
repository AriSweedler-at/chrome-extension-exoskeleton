import {TabRegistry} from '@exo/library/popup-exo-tabs/tab-registry';
import {OpenSearchComponent} from '@exo/library/opensearch/OpenSearchComponent';
import {
    ExtractLogCommandAction,
    type ExtractLogCommandResult,
} from '@exo/library/actions/extract-log-command.action';
import {isOpenSearchPage} from '@exo/library/opensearch';

TabRegistry.register({
    id: 'opensearch',
    label: 'OpenSearch',
    component: OpenSearchComponent,
    getPriority: (url: string) => {
        if (isOpenSearchPage(url)) return 0;
        return Number.MAX_SAFE_INTEGER;
    },
    primaryAction: async (tabId) => {
        const result: ExtractLogCommandResult = await ExtractLogCommandAction.sendToTab(
            tabId,
            undefined as void,
        );
        return result.success;
    },
});
