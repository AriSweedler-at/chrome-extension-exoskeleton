import {useState, useEffect} from 'react';
import {Tabs} from '@exo/library/tabs';
import {TabBar} from './TabBar';
import './Popup.css';

export function Popup() {
    const [loading, setLoading] = useState<boolean>(true);
    const [canInject, setCanInject] = useState<boolean>(false);

    useEffect(() => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            setCanInject(Tabs.canInjectContent(tab?.url));
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="popup">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (!canInject) {
        return (
            <div className="popup">
                <div className="restriction-notice">
                    <h2>Ari&apos;s Chrome Exoskeleton is not allowed to run on this page.</h2>
                    <p>
                        Your browser does not run web extensions like this on certain pages, usually
                        for security reasons.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="popup">
            <TabBar />
        </div>
    );
}
