import {useState, useEffect} from 'react';
import {IncrementAction} from '../actions/increment.action';
import {GetCountAction} from '../actions/get-count.action';
import './Popup.css';

export function Popup() {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get initial count when popup opens
        GetCountAction.sendToActiveTab(undefined)
            .then((result) => {
                setCount((result as {count: number}).count);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to get count');
                setLoading(false);
            });
    }, []);

    const handleIncrement = async () => {
        try {
            const result = (await IncrementAction.sendToActiveTab({
                amount: 1,
            })) as {count: number};
            setCount(result.count);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to increment');
        }
    };

    const handleOpenShortcuts = () => {
        chrome.tabs.create({url: 'chrome://extensions/shortcuts'});
    };

    if (loading) {
        return (
            <div className="popup">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="popup">
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
        </div>
    );
}
