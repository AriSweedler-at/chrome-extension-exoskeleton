import {TabRegistry} from '../library/tabs/tab-registry';
import {SpinnakerContent} from '../components/SpinnakerComponent';
import {isSpinnakerSearchPage} from '../library/spinnaker';

const SpinnakerComponent = () => {
    return <SpinnakerContent />;
};

TabRegistry.register({
    id: 'spinnaker',
    label: 'Spinnaker',
    component: SpinnakerComponent,
    getPriority: (url: string) => {
        if (isSpinnakerSearchPage(url)) {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    },
    enablementToggle: true,
});
