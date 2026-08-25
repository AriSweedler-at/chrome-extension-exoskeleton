import {TabRegistry, matchPriority} from '@exo/lib/popup-exo-tabs/tab-registry';
import {makeEnvCycleAction, withEnvRow} from '@exo/lib/popup-exo-tabs/environment-ui';
import {isSpaceliftStackPage, getEnvironments} from '@exo/exo-tabs/spacelift';

TabRegistry.register({
    id: 'spacelift',
    label: 'Spacelift',
    component: withEnvRow(getEnvironments),
    getPriority: matchPriority(isSpaceliftStackPage),
    // Toast the destination stack's name, not just the bare env name.
    primaryAction: makeEnvCycleAction(
        getEnvironments,
        (next) => new URL(next.url).pathname.split('/').pop() ?? '',
    ),
});
