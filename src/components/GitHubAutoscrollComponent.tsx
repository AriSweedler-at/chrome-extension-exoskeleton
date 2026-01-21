import React, {useState, useEffect} from 'react';

// Message type constants for type safety
const MESSAGE_TYPES = {
    GET_STATUS: 'GITHUB_AUTOSCROLL_GET_STATUS',
    TOGGLE: 'GITHUB_AUTOSCROLL_TOGGLE',
} as const;

export function GitHubAutoscrollContent() {
    const [active, setActive] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [tabId, setTabId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const tab = tabs[0];

            if (!mounted) return;

            setTabId(tab?.id || null);

            if (tab?.id) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        type: MESSAGE_TYPES.GET_STATUS,
                    });
                    if (mounted) {
                        setActive(response.active);
                    }
                } catch {
                    if (mounted) {
                        setActive(false);
                    }
                }
            }
            if (mounted) {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
        };
    }, []);

    const handleToggle = async () => {
        if (!tabId) return;

        setError(null);
        try {
            const response = await chrome.tabs.sendMessage(tabId, {
                type: MESSAGE_TYPES.TOGGLE,
            });
            setActive(response.active);
        } catch (error) {
            console.error('Failed to toggle autoscroll:', error);
            setError('Failed to toggle autoscroll. Please try again.');
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
            {error && (
                <div style={{color: 'red', marginBottom: '12px'}} data-testid="error-message">
                    {error}
                </div>
            )}
            <button onClick={handleToggle} style={{padding: '8px 16px'}}>
                {active ? 'Disable' : 'Enable'}
            </button>
        </div>
    );
}
