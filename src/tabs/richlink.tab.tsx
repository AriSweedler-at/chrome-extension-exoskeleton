import {TabRegistry} from '../library/tabs/tab-registry';
import {RichLinkComponent} from '../components/RichLinkComponent';
// Must import handlers to trigger auto-registration
import '../library/richlink/handlers';

TabRegistry.register({
    id: 'richlink',
    label: 'Rich Link',
    component: RichLinkComponent,
    enablementToggle: true,
    getPriority: () => 0, // Default tab (highest priority)
    primaryAction: async () => false,
});
