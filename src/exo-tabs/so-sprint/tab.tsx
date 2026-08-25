import {TabRegistry, matchPriority} from '@exo/lib/popup-exo-tabs/tab-registry';
import {safeUrl} from '@exo/lib/url';

const SoSprintComponent = () => {
    return <div>HELLO, WORLD - you are in SO SPRINT</div>;
};

function isSoSprintPage(url: string): boolean {
    const u = safeUrl(url);
    return (
        !!u &&
        (u.hostname === 'airtable.com' || u.hostname.endsWith('.airtable.app')) &&
        u.pathname.startsWith('/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6')
    );
}

TabRegistry.register({
    id: 'so-sprint',
    label: 'SO SPRINT',
    component: SoSprintComponent,
    primaryAction: async () => false, // No action yet
    getPriority: matchPriority(isSoSprintPage),
});
