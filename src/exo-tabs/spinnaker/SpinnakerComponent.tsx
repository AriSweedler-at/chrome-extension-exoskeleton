import {useState, type CSSProperties} from 'react';
import {
    SPINNAKER_POPUP_ACTIONS,
    SpinnakerRunAction,
    type SpinnakerActionId,
} from '@exo/exo-tabs/spinnaker/action';
import {theme} from '@exo/theme/default';

const buttonStyle: CSSProperties = {
    padding: '12px 16px',
    fontSize: '14px',
    border: `1px solid ${theme.border.light}`,
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'white',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const kbdStyle: CSSProperties = {
    padding: '2px 6px',
    fontSize: '12px',
    backgroundColor: theme.bg.cardSubtle,
    border: `1px solid ${theme.border.light}`,
    borderRadius: '3px',
};

/**
 * Spinnaker tab component
 *
 * Each button sends its action to the page's content script, which runs the
 * identical handler the matching keybinding runs — the kbd chip and the
 * click are one mechanism. Keyboard shortcuts are registered in page.ts.
 */
export function SpinnakerContent() {
    const [error, setError] = useState<string | null>(null);

    const runAction = async (action: SpinnakerActionId) => {
        setError(null);
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab?.id) throw new Error('No active tab');
            await SpinnakerRunAction.sendToTab(tab.id, {action});
        } catch (err) {
            // No content script answered (not a Spinnaker page, or the tab
            // is disabled) — surface it instead of silently doing nothing.
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            console.error('Spinnaker popup action failed:', err);
        }
    };

    return (
        <div style={{padding: '16px'}}>
            <h2 style={{marginTop: 0, marginBottom: '16px'}}>Execution Controls</h2>

            {error && (
                <div style={{color: 'red', marginBottom: '12px'}} data-testid="error-message">
                    {error}
                </div>
            )}

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {SPINNAKER_POPUP_ACTIONS.map(({id, label, key}) => (
                    <button key={id} onClick={() => runAction(id)} style={buttonStyle}>
                        <span>{label}</span>
                        <kbd style={kbdStyle}>{key}</kbd>
                    </button>
                ))}
            </div>
        </div>
    );
}
