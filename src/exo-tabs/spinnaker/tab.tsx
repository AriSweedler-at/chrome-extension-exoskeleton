import {TabRegistry, matchPriority} from '@exo/lib/popup-exo-tabs/tab-registry';
import {withEnvRow} from '@exo/lib/popup-exo-tabs/environment-ui';
import {SpinnakerContent} from '@exo/exo-tabs/spinnaker/SpinnakerComponent';
import {isSpinnakerPage, getEnvironments} from '@exo/exo-tabs/spinnaker/url-match';

TabRegistry.register({
    id: 'spinnaker',
    label: 'Spinnaker',
    component: withEnvRow(getEnvironments, SpinnakerContent),
    enablementToggle: true,
    getPriority: matchPriority(isSpinnakerPage),
});
