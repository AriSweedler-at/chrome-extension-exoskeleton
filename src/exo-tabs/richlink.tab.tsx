import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {RichLinkComponent} from '@exo/lib/richlink/RichLinkComponent';
// Must import handlers to trigger auto-registration
import '@exo/lib/richlink/handlers';

TabRegistry.register({
    id: 'richlink',
    label: 'Rich Link',
    component: RichLinkComponent,
    enablementToggle: true,
    getPriority: () => 0, // Default tab (highest priority)
    primaryAction: async () => false,
});
