import React from 'react';
import {Component} from '../library/components/base-component';
import {TabRegistry} from '../library/tabs/tab-registry';

class SoSprintComponent extends Component {
    render() {
        return React.createElement('div', null, 'HELLO, WORLD - you are in SO SPRINT');
    }
}

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
