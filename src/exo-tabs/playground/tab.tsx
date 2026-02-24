import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {PlaygroundComponent} from '@exo/exo-tabs/playground/PlaygroundComponent';

TabRegistry.register({
    id: 'playground',
    label: 'Playground',
    component: PlaygroundComponent,
    enablementToggle: true,
    primaryAction: async () => false,
    getPriority: (url: string) => {
        if (url.includes('docs.google.com/document')) return 0;
        return Number.MAX_SAFE_INTEGER;
    },
});
