import React from 'react';
import ReactDOM from 'react-dom/client';
import {Popup} from '@exo/popup/Popup';

// Import tabs to register them
import '@exo/exo-tabs';

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <Popup />
        </React.StrictMode>,
    );
}
