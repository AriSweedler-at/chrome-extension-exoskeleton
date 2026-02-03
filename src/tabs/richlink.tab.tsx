import {TabRegistry} from '../library/tabs/tab-registry';
import {RichLinkComponent} from '../components/RichLinkComponent';
import {HandlerRegistry} from '../library/richlink/handlers';

// Must import handlers to trigger auto-registration
import '../library/richlink/handlers';

TabRegistry.register({
    id: 'richlink',
    label: 'Rich Link',
    component: RichLinkComponent,
    enablementToggle: true,
    getPriority: (url: string) => {
        // Priority 0 if any specialized handler matches, 100 for fallback only
        return HandlerRegistry.hasSpecializedHandler(url) ? 0 : 100;
    },
});
