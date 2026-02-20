import {useState} from 'react';
import {Card} from './Card';
import {theme} from '../theme/default';
import {
    ExtractLogCommandAction,
    type ExtractLogCommandResult,
} from '../actions/extract-log-command.action';

const buttonStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: `1px solid ${theme.border.light}`,
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
                                ? theme.status.success
                                : status === 'error'
                                  ? theme.status.error
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
            </div>

            <Card style={{marginTop: '12px', textAlign: 'center', fontSize: '12px'}}>
                <span style={{color: theme.text.secondary}}>gdoc: </span>
                <a
                    href="https://docs.google.com/document/d/1KYPqzgn-oA3pXTtN4PU6jhXm_RiH4R150zIQ9SAKXus"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{color: theme.text.link, textDecoration: 'none'}}
                >
                    How to access _debug logs
                </a>
            </Card>
        </div>
    );
}
