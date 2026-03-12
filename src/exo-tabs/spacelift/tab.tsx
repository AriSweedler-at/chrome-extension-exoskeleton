import {useState, useEffect} from 'react';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {NotificationType} from '@exo/lib/toast-notification';
import type {ShowToastPayload} from '@exo/lib/actions/show-toast.action';
import {navigateAndToast} from '@exo/lib/service-worker/navigate-with-toast';
import {theme} from '@exo/theme/default';
import {
    isSpaceliftStackPage,
    getEnvironments,
    getNextEnvironmentUrl,
    type EnvironmentInfo,
} from '@exo/exo-tabs/spacelift';

function makeToast(url: string): ShowToastPayload {
    return {
        message: `Navigating to ${new URL(url).pathname.split('/').pop()}`,
        type: NotificationType.Success,
        duration: 2000,
    };
}

/** Navigate from popup — delegates to service worker so the popup doesn't close. */
async function navigateFromPopup(url: string): Promise<void> {
    await chrome.runtime.sendMessage({
        type: 'NAVIGATE_WITH_TOAST',
        payload: {tabId: -1, url, toast: makeToast(url)},
    });
}

function EnvButton({info}: {info: EnvironmentInfo}) {
    const bg = info.current ? theme.richlink.fallbackBg : theme.richlink.specializedBg;
    const hoverBg = info.current ? theme.richlink.fallbackBg : theme.richlink.specializedHoverBg;

    return (
        <button
            disabled={info.current}
            onClick={() => navigateFromPopup(info.url)}
            onMouseEnter={(e) => {
                if (!info.current) e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = bg;
            }}
            style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: `1px solid ${theme.richlink.border}`,
                borderRadius: '4px',
                backgroundColor: bg,
                color: theme.text.white,
                cursor: info.current ? 'default' : 'pointer',
                opacity: info.current ? 0.5 : 1,
                transition: 'all 0.15s ease',
            }}
        >
            {info.env}
        </button>
    );
}

const SpaceliftComponent = () => {
    const [envs, setEnvs] = useState<EnvironmentInfo[] | undefined>();

    useEffect(() => {
        const refresh = () => {
            chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
                if (tab?.url) setEnvs(getEnvironments(tab.url));
            });
        };
        refresh();

        const onUpdated = (_tabId: number, info: chrome.tabs.TabChangeInfo) => {
            if (info.url) refresh();
        };
        chrome.tabs.onUpdated.addListener(onUpdated);
        return () => chrome.tabs.onUpdated.removeListener(onUpdated);
    }, []);

    if (!envs) return null;

    return (
        <div style={{padding: '16px', display: 'flex', gap: '8px'}}>
            {envs.map((info) => (
                <EnvButton key={info.env} info={info} />
            ))}
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
    primaryAction: async (tabId, url) => {
        const next = getNextEnvironmentUrl(url);
        if (!next) return false;
        await navigateAndToast(tabId, next, makeToast(next));
        return true;
    },
});
