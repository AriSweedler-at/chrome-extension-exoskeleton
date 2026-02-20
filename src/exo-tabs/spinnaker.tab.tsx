import {TabRegistry} from '@exo/library/popup-exo-tabs/tab-registry';
import {SpinnakerContent} from '@exo/library/spinnaker/SpinnakerComponent';

const SpinnakerComponent = () => {
    return <SpinnakerContent />;
};

TabRegistry.register({
    id: 'spinnaker',
    label: 'Spinnaker',
    component: SpinnakerComponent,
    enablementToggle: true,
    primaryAction: async () => false, // No content script action yet
    getPriority: (url: string) => {
        // Show tab on any URL containing "spinnaker" (case-insensitive)
        if (url.toLowerCase().includes('spinnaker')) {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    },
});
