import type {CSSProperties} from 'react';
import {
    toggleExecution,
    displayActiveExecution,
    displayActiveStage,
    jumpToExecution,
    extractPodNames,
} from '@exo/exo-tabs/spinnaker/actions';
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

const ACTIONS = [
    {label: 'Toggle Execution Details', key: 'e', handler: toggleExecution},
    {label: 'Show Active Execution', key: 'x', handler: displayActiveExecution},
    {label: 'Show Active Stage', key: 's', handler: displayActiveStage},
    {label: 'Jump to Execution', key: 'j', handler: jumpToExecution},
    {label: 'Extract Pod Names', key: 'p', handler: () => extractPodNames()},
] as const;

/**
 * Spinnaker tab component
 *
 * Provides UI buttons for Spinnaker operations.
 * Keyboard shortcuts are registered in page.ts (content script).
 */
export function SpinnakerContent() {
    return (
        <div style={{padding: '16px'}}>
            <h2 style={{marginTop: 0, marginBottom: '16px'}}>Execution Controls</h2>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {ACTIONS.map(({label, key, handler}) => (
                    <button key={key} onClick={handler} style={buttonStyle}>
                        <span>{label}</span>
                        <kbd style={kbdStyle}>{key}</kbd>
                    </button>
                ))}
            </div>
        </div>
    );
}
