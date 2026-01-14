import React from 'react';
import ReactDOM from 'react-dom/client';
import {Popup} from './Popup';

// Import tabs to register them
import '../tabs/page-actions.tab';
import '../tabs/so-sprint.tab';

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <Popup />
        </React.StrictMode>,
    );
}
