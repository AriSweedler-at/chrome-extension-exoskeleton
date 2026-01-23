import { TabRegistry } from '../library/tabs/tab-registry';
import { SpinnakerContent } from '../components/SpinnakerComponent';

const SpinnakerComponent = () => {
    return <SpinnakerContent />;
};

TabRegistry.register({
    id: 'spinnaker',
    label: 'Spinnaker',
    component: SpinnakerComponent,
    getPriority: (url: string) => {
        // Show tab on any URL containing "spinnaker" (case-insensitive)
        if (url.toLowerCase().includes('spinnaker')) {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    },
});
