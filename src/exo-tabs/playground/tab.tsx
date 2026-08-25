import {TabRegistry, matchPriority} from '@exo/lib/popup-exo-tabs/tab-registry';
import {PlaygroundComponent} from '@exo/exo-tabs/playground/PlaygroundComponent';

TabRegistry.register({
    id: 'playground',
    label: 'Playground',
    component: PlaygroundComponent,
    enablementToggle: true,
    primaryAction: async () => false,
    getPriority: matchPriority((url) => url.includes('docs.google.com/document')),
});
