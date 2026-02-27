import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {SpinnakerContent} from '@exo/exo-tabs/spinnaker/SpinnakerComponent';
import {isSpinnakerPage} from '@exo/exo-tabs/spinnaker/url-match';

TabRegistry.register({
    id: 'spinnaker',
    label: 'Spinnaker',
    component: SpinnakerContent,
    enablementToggle: true,
    primaryAction: async () => false,
    getPriority: (url: string) => {
        if (isSpinnakerPage(url)) return 0;
        return Number.MAX_SAFE_INTEGER;
    },
});
