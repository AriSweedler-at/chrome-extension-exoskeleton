import {TabRegistry, matchPriority} from '@exo/lib/popup-exo-tabs/tab-registry';
import {withEnvRow} from '@exo/lib/popup-exo-tabs/environment-ui';
import {isSpaceliftStackPage, getEnvironments} from '@exo/exo-tabs/spacelift';

TabRegistry.register({
    id: 'spacelift',
    label: 'Spacelift',
    component: withEnvRow(getEnvironments),
    getPriority: matchPriority(isSpaceliftStackPage),
});
