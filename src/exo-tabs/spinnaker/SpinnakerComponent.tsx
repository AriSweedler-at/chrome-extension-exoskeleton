import {
    toggleExecution,
    displayActiveExecution,
    displayActiveStage,
    jumpToExecution,
    extractPodNames,
} from '@exo/exo-tabs/spinnaker/actions';
import {theme} from '@exo/theme/default';

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
                <button
                    onClick={toggleExecution}
                    style={{
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
                    }}
                >
                    <span>Toggle Execution Details</span>
                    <kbd
                        style={{
                            padding: '2px 6px',
                            fontSize: '12px',
                            backgroundColor: theme.bg.cardSubtle,
                            border: `1px solid ${theme.border.light}`,
                            borderRadius: '3px',
                        }}
                    >
                        e
                    </kbd>
                </button>

                <button
                    onClick={displayActiveExecution}
                    style={{
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
                    }}
                >
                    <span>Show Active Execution</span>
                    <kbd
                        style={{
                            padding: '2px 6px',
                            fontSize: '12px',
                            backgroundColor: theme.bg.cardSubtle,
                            border: `1px solid ${theme.border.light}`,
                            borderRadius: '3px',
                        }}
                    >
                        x
                    </kbd>
                </button>

                <button
                    onClick={displayActiveStage}
                    style={{
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
                    }}
                >
                    <span>Show Active Stage</span>
                    <kbd
                        style={{
                            padding: '2px 6px',
                            fontSize: '12px',
                            backgroundColor: theme.bg.cardSubtle,
                            border: `1px solid ${theme.border.light}`,
                            borderRadius: '3px',
                        }}
                    >
                        s
                    </kbd>
                </button>

                <button
                    onClick={jumpToExecution}
                    style={{
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
                    }}
                >
                    <span>Jump to Execution</span>
                    <kbd
                        style={{
                            padding: '2px 6px',
                            fontSize: '12px',
                            backgroundColor: theme.bg.cardSubtle,
                            border: `1px solid ${theme.border.light}`,
                            borderRadius: '3px',
                        }}
                    >
                        j
                    </kbd>
                </button>

                <button
                    onClick={() => extractPodNames()}
                    style={{
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
                    }}
                >
                    <span>Extract Pod Names</span>
                    <kbd
                        style={{
                            padding: '2px 6px',
                            fontSize: '12px',
                            backgroundColor: theme.bg.cardSubtle,
                            border: `1px solid ${theme.border.light}`,
                            borderRadius: '3px',
                        }}
                    >
                        p
                    </kbd>
                </button>
            </div>
        </div>
    );
}
