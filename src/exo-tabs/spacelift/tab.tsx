import {useState, useEffect} from 'react';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {ShowToastAction} from '@exo/lib/actions/show-toast.action';
import {NotificationType} from '@exo/lib/toast-notification';
import {theme} from '@exo/theme/default';
import {
    isSpaceliftStackPage,
    getAdjacentEnvironments,
    getNextEnvironmentUrl,
    getPrevEnvironmentUrl,
} from '@exo/exo-tabs/spacelift';

async function navigate(getUrl: (url: string) => string | undefined): Promise<boolean> {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.id || !tab.url) return false;
    const url = getUrl(tab.url);
    if (!url) return false;
    await ShowToastAction.sendToTab(tab.id, {
        message: `Navigating to ${new URL(url).pathname.split('/').pop()}`,
        type: NotificationType.Success,
    });
    await chrome.tabs.update(tab.id, {url});
    return true;
}

const buttonStyle = {
    flex: 1,
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    border: '2px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: theme.status.successDark,
    color: 'white',
    borderColor: theme.status.successDarkBorder,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
};

const SpaceliftComponent = () => {
    const [adjacent, setAdjacent] = useState<{prev: string; next: string} | undefined>();

    useEffect(() => {
        chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
            if (tab?.url) setAdjacent(getAdjacentEnvironments(tab.url));
        });
    }, []);

    if (!adjacent) return null;

    return (
        <div style={{padding: '16px', display: 'flex', gap: '8px'}}>
            <button onClick={() => navigate(getPrevEnvironmentUrl)} style={buttonStyle}>
                &larr; {adjacent.prev}
            </button>
            <button onClick={() => navigate(getNextEnvironmentUrl)} style={buttonStyle}>
                {adjacent.next} &rarr;
            </button>
        </div>
    );
};

TabRegistry.register({
    id: 'spacelift',
    label: 'Spacelift',
    component: SpaceliftComponent,
    getPriority: (url: string) => {
        if (isSpaceliftStackPage(url)) return 0;
        return Number.MAX_SAFE_INTEGER;
    },
    primaryAction: () => navigate(getNextEnvironmentUrl),
});
