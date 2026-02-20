import {useState} from 'react';
import {
    ExtractLogCommandAction,
    type ExtractLogCommandResult,
} from '../actions/extract-log-command.action';
import {ShowToastAction} from '../actions/show-toast.action';

const MOCK_COMMAND_DISPLAY = `grunt admin:log_fetch:fetchMatchingLogMessageFromHost
  --hostname=ip-172-30-183-104
  --cluster=production-use1-asyncServing-shard02-002
  --pod=workflow-execution-service-stable-shardgroup-14-5899d6ffc4dqspw
  --search='Post processing result for job'`;

const buttonStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'white',
    color: 'black',
    textAlign: 'left' as const,
};

export function OpenSearchComponent() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');

    const handleClick = async () => {
        setStatus('loading');
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab.id) throw new Error('No active tab');

            // Focus the tab so content script can access clipboard
            await chrome.tabs.update(tab.id, {active: true});
            await new Promise((resolve) => setTimeout(resolve, 100));

            const result: ExtractLogCommandResult =
                await ExtractLogCommandAction.sendToTab(tab.id, undefined as void);

            if (result.success) {
                setStatus('success');
                setMessage('Copied!');
            } else {
                setStatus('error');
                setMessage(result.error || 'Failed');
            }
        } catch (err) {
            setStatus('error');
            const msg = err instanceof Error ? err.message : String(err);
            setMessage(msg);
            console.error('OpenSearch extract failed:', err);
        }
        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 2000);
    };

    const handleTestToast = async () => {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab.id) return;
            await ShowToastAction.sendToTab(tab.id, {
                message: 'Copied log fetch command',
                type: 'success',
                duration: 5000,
                detail: MOCK_COMMAND_DISPLAY,
            });
        } catch (err) {
            console.error('Test toast failed:', err);
        }
    };

    return (
        <div style={{padding: '16px'}}>
            <h2 style={{marginTop: 0, marginBottom: '16px'}}>OpenSearch Helper</h2>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <button
                    onClick={handleClick}
                    disabled={status === 'loading'}
                    style={{
                        ...buttonStyle,
                        backgroundColor:
                            status === 'success'
                                ? '#22c55e'
                                : status === 'error'
                                  ? '#ef4444'
                                  : 'white',
                        color: status === 'idle' || status === 'loading' ? 'black' : 'white',
                    }}
                >
                    {status === 'loading'
                        ? 'Extracting...'
                        : status === 'idle'
                          ? 'Copy Log Fetch Command'
                          : message}
                </button>

                <button onClick={handleTestToast} style={buttonStyle}>
                    Test Toast Notification
                </button>
            </div>

            <a
                href="https://docs.google.com/document/d/1KYPqzgn-oA3pXTtN4PU6jhXm_RiH4R150zIQ9SAKXus/edit?tab=t.0#heading=h.hwsgb8j58zq6"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'block',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#2563eb',
                    textDecoration: 'underline',
                }}
            >
                How to access _debug logs
            </a>
        </div>
    );
}
