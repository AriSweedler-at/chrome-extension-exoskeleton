import {useEffect} from 'react';
import {
    toggleExecution,
    displayActiveExecution,
    displayActiveStage,
    jumpToExecution,
    extractPodNames,
} from '@library/spinnaker/actions';
import {keybindings} from '@library/keybindings';
import {theme} from '@theme';

/**
 * Spinnaker tab component
 *
 * Provides UI buttons and keyboard shortcuts for Spinnaker operations:
 * - Toggle execution details (e)
 * - Show active execution (x)
 * - Show active stage (s)
 * - Jump to execution (j)
 * - Extract pod names (p)
 */
export function SpinnakerContent() {
    useEffect(() => {
        // Register Spinnaker keybindings
        keybindings.registerAll([
            {
                key: 'e',
                description: 'Toggle execution details',
                handler: toggleExecution,
                context: 'Spinnaker',
            },
            {
                key: 'x',
                description: 'Show active execution',
                handler: displayActiveExecution,
                context: 'Spinnaker',
            },
            {
                key: 's',
                description: 'Show active stage',
                handler: displayActiveStage,
                context: 'Spinnaker',
            },
            {
                key: 'j',
                description: 'Jump to execution',
                handler: jumpToExecution,
                context: 'Spinnaker',
            },
            {
                key: 'p',
                description: 'Extract pod names',
                handler: extractPodNames,
                context: 'Spinnaker',
            },
        ]);
        keybindings.listen();

        return () => {
            // Unregister Spinnaker keybindings on unmount
            keybindings.unregister('e');
            keybindings.unregister('x');
            keybindings.unregister('s');
            keybindings.unregister('j');
            keybindings.unregister('p');
            keybindings.unlisten();
        };
    }, []);

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
