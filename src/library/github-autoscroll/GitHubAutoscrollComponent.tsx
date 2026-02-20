import React, {useState, useEffect} from 'react';
import {theme} from '@exo/theme/default';

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

        const loadState = async () => {
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
        };

        loadState();

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
        return <div style={{padding: '16px'}}>Loading...</div>;
    }

    return (
        <div style={{padding: '16px'}}>
            {error && (
                <div style={{color: 'red', marginBottom: '12px'}} data-testid="error-message">
                    {error}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                }}
            >
                <button
                    onClick={handleToggle}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        border: '2px solid',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: active ? theme.status.successDark : theme.status.errorDark,
                        color: 'white',
                        borderColor: active
                            ? theme.status.successDarkBorder
                            : theme.status.errorDarkBorder,
                        transition: 'all 0.2s',
                    }}
                >
                    {active ? '✓ Active' : '○ Inactive'}
                </button>
            </div>
        </div>
    );
}
