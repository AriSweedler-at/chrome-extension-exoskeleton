import { useEffect } from 'react';
import {
    toggleExecution,
    displayActiveExecution,
    displayActiveStage,
    jumpToExecution,
    extractPodNames,
} from '../library/spinnaker/actions';

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
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input/textarea
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            const key = event.key.toLowerCase();

            switch (key) {
                case 'e':
                    event.preventDefault();
                    toggleExecution();
                    break;
                case 'x':
                    event.preventDefault();
                    displayActiveExecution();
                    break;
                case 's':
                    event.preventDefault();
                    displayActiveStage();
                    break;
                case 'j':
                    event.preventDefault();
                    jumpToExecution();
                    break;
                case 'p':
                    event.preventDefault();
                    extractPodNames();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div style={{ padding: '16px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Execution Controls</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                    onClick={toggleExecution}
                    style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
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
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ccc',
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
                        border: '1px solid #ccc',
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
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ccc',
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
                        border: '1px solid #ccc',
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
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ccc',
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
                        border: '1px solid #ccc',
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
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ccc',
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
                        border: '1px solid #ccc',
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
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ccc',
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
