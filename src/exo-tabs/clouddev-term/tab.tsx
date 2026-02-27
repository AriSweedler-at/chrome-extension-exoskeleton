import {useState} from 'react';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {theme} from '@exo/theme/default';

async function requestSetFont(): Promise<{applied: boolean; previous: string}> {
    return chrome.runtime.sendMessage({type: 'CLOUDDEV_TERM_SET_FONT'});
}

const ClouddevTermComponent = () => {
    const [status, setStatus] = useState<string | null>(null);

    const handleSetFont = async () => {
        try {
            const result = await requestSetFont();
            if (result.applied) {
                setStatus(`Font set (was: ${result.previous})`);
            } else {
                setStatus(result.previous);
            }
        } catch {
            setStatus('Failed — try refreshing the page.');
        }
    };

    return (
        <div style={{padding: '16px'}}>
            <button
                onClick={handleSetFont}
                style={{
                    width: '100%',
                    padding: '16px 24px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: '2px solid',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: theme.status.successDark,
                    color: 'white',
                    borderColor: theme.status.successDarkBorder,
                    transition: 'all 0.2s',
                }}
            >
                Set CaskaydiaMono Nerd Font
            </button>
            {status && (
                <div style={{marginTop: '8px', fontSize: '12px', opacity: 0.7}}>{status}</div>
            )}
        </div>
    );
};

TabRegistry.register({
    id: 'clouddev-term',
    label: 'Terminal',
    component: ClouddevTermComponent,
    primaryAction: async () => {
        const result = await requestSetFont();
        return result.applied;
    },
    getPriority: (url: string) => {
        try {
            const hostname = new URL(url).hostname;
            if (hostname.endsWith('-term.clouddev.hyperbasedev.com')) return 0;
        } catch {
            // invalid URL
        }
        return Number.MAX_SAFE_INTEGER;
    },
});
