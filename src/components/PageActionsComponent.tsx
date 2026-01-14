import {useState, useEffect} from 'react';
import {IncrementAction} from '../actions/increment.action';
import {GetCountAction} from '../actions/get-count.action';
import {Tabs} from '../library/tabs';

export function PageActionsContent() {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [canInject, setCanInject] = useState<boolean>(false);

    useEffect(() => {
        // Listen for count updates
        const listener = (
            message: {type: string; count: number},
            _sender: chrome.runtime.MessageSender,
        ) => {
            if (message.type === 'COUNT_UPDATED') {
                setCount(message.count);
            }
        };

        chrome.runtime.onMessage.addListener(listener);

        // Get initial count when popup opens
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];

            // Check if we can inject content scripts into this page
            if (!Tabs.canInjectContent(tab?.url)) {
                setCanInject(false);
                setLoading(false);
                return;
            }

            setCanInject(true);
            GetCountAction.sendToActiveTab(undefined)
                .then((result) => {
                    setCount((result as {count: number}).count);
                    setLoading(false);
                })
                .catch((err) => {
                    const errorMsg = err.message || '';
                    if (errorMsg.includes('Receiving end does not exist')) {
                        setError(
                            'Content script not loaded. Please refresh this page to use the extension.',
                        );
                    } else {
                        setError(errorMsg || 'Failed to get count');
                    }
                    setLoading(false);
                });
        });

        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }, []);

    const handleIncrement = async () => {
        if (!canInject) {
            return;
        }

        try {
            const result = (await IncrementAction.sendToActiveTab({
                amount: 1,
            })) as {count: number};
            setCount(result.count);
            setError(null);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to increment';
            if (errorMsg.includes('Receiving end does not exist')) {
                setError(
                    'Content script not loaded. Please refresh this page to use the extension.',
                );
            } else {
                setError(errorMsg);
            }
        }
    };

    const handleOpenShortcuts = () => {
        chrome.tabs.create({url: 'chrome://extensions/shortcuts'});
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <>
            <h1>Page Actions</h1>
            <div className="count-display">
                <span className="count-label">Count:</span>
                <span className="count-value">{count}</span>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="increment-button" onClick={handleIncrement}>
                Increment
            </button>
            <button className="shortcuts-button" onClick={handleOpenShortcuts}>
                Configure Keyboard Shortcut
            </button>
            <div className="footer">
                Press <kbd>Ctrl+Shift+I</kbd> or click button to increment
            </div>
        </>
    );
}
