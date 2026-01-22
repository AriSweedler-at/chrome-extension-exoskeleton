import {TabRegistry} from '../library/tabs/tab-registry';

const SoSprintComponent = () => {
    return <div>HELLO, WORLD - you are in SO SPRINT</div>;
};

TabRegistry.register({
    id: 'so-sprint',
    label: 'SO SPRINT',
    component: SoSprintComponent,
    getPriority: (url: string) => {
        if (url === 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6') {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    },
});
