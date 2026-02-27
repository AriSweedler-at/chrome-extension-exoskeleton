import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';

const SoSprintComponent = () => {
    return <div>HELLO, WORLD - you are in SO SPRINT</div>;
};

TabRegistry.register({
    id: 'so-sprint',
    label: 'SO SPRINT',
    component: SoSprintComponent,
    primaryAction: async () => false, // No action yet
    getPriority: (url: string) => {
        try {
            const urlObj = new URL(url);
            if (
                urlObj.hostname === 'airtable.com' &&
                urlObj.pathname.startsWith('/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6')
            ) {
                return 0;
            }
        } catch {
            // invalid URL
        }
        return Number.MAX_SAFE_INTEGER;
    },
});
