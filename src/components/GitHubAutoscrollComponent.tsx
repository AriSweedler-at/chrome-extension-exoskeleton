import React, {useState, useEffect} from 'react';

export function GitHubAutoscrollContent() {
    const [active, setActive] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [tabId, setTabId] = useState<number | null>(null);

    useEffect(() => {
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const tab = tabs[0];
            setTabId(tab.id || null);

            if (tab.id) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        type: 'GITHUB_AUTOSCROLL_GET_STATUS',
                    });
                    setActive(response.active);
                } catch {
                    setActive(false);
                }
            }
            setLoading(false);
        });
    }, []);

    const handleToggle = async () => {
        if (!tabId) return;

        try {
            const response = await chrome.tabs.sendMessage(tabId, {
                type: 'GITHUB_AUTOSCROLL_TOGGLE',
            });
            setActive(response.active);
        } catch (error) {
            console.error('Failed to toggle autoscroll:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{padding: '16px'}}>
            <div style={{marginBottom: '12px'}}>
                <strong>Status:</strong> {active ? 'Active ✓' : 'Inactive'}
            </div>
            <button onClick={handleToggle} style={{padding: '8px 16px'}}>
                {active ? 'Disable' : 'Enable'}
            </button>
        </div>
    );
}
