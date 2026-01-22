import React, {useState, useEffect} from 'react';
import {Storage} from '../library/storage';

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
    const [autoRunEnabled, setAutoRunEnabled] = useState<boolean>(true);

    useEffect(() => {
        let mounted = true;

        const loadState = async () => {
            // Load auto-run preference from storage
            const exorun = await Storage.get<boolean>('exorun-github-autoscroll');
            if (mounted) {
                setAutoRunEnabled(exorun === undefined ? true : exorun);
            }

            // Query current tab status
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
            // Note: This only affects the current session, not the permanent auto-run setting
        } catch (error) {
            console.error('Failed to toggle autoscroll:', error);
            setError('Failed to toggle autoscroll. Please try again.');
        }
    };

    const handleAutoRunToggle = async () => {
        const newValue = !autoRunEnabled;
        console.log('[Auto-run Toggle] Setting exorun-github-autoscroll to:', newValue);
        await Storage.set('exorun-github-autoscroll', newValue);
        setAutoRunEnabled(newValue);
        console.log('[Auto-run Toggle] Storage updated successfully');

        // Also affect the current session
        if (!tabId) return;

        // If enabling and not currently active, turn it on
        if (newValue && !active) {
            try {
                const response = await chrome.tabs.sendMessage(tabId, {
                    type: MESSAGE_TYPES.TOGGLE,
                });
                setActive(response.active);
            } catch (error) {
                console.error('Failed to enable autoscroll:', error);
            }
        }
        // If disabling and currently active, turn it off
        else if (!newValue && active) {
            try {
                const response = await chrome.tabs.sendMessage(tabId, {
                    type: MESSAGE_TYPES.TOGGLE,
                });
                setActive(response.active);
            } catch (error) {
                console.error('Failed to disable autoscroll:', error);
            }
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

            {/* Main toggle switch */}
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
                        backgroundColor: active ? '#4CAF50' : '#f44336',
                        color: 'white',
                        borderColor: active ? '#45a049' : '#da190b',
                        transition: 'all 0.2s',
                    }}
                >
                    {active ? '✓ Active' : '○ Inactive'}
                </button>
            </div>

            {/* Auto-run preference */}
            <div
                style={{
                    borderTop: '1px solid #ccc',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span>Auto-run on page load:</span>
                <label
                    htmlFor="autorun-checkbox"
                    style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}
                >
                    <input
                        id="autorun-checkbox"
                        name="autorun-checkbox"
                        type="checkbox"
                        checked={autoRunEnabled}
                        onChange={handleAutoRunToggle}
                        style={{marginRight: '8px', cursor: 'pointer'}}
                    />
                    <span>{autoRunEnabled ? 'Enabled' : 'Disabled'}</span>
                </label>
            </div>
        </div>
    );
}
