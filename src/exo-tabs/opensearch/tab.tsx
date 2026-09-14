import {TabRegistry, matchPriority} from '@exo/lib/popup-exo-tabs/tab-registry';
import {withEnvRow} from '@exo/lib/popup-exo-tabs/environment-ui';
import {OpenSearchComponent} from '@exo/exo-tabs/opensearch/OpenSearchComponent';
import {isOpenSearchPage, getEnvironments} from '@exo/exo-tabs/opensearch';

TabRegistry.register({
    id: 'opensearch',
    label: 'OpenSearch',
    component: withEnvRow(getEnvironments, OpenSearchComponent),
    getPriority: matchPriority(isOpenSearchPage),
});
