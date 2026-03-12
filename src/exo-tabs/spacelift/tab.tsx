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

async function navigateFromPopup(url: string): Promise<void> {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.id) return;
    await navigateAndToast(tab.id, url, makeToast(url));
}

const STYLE = {
    current: {
        bg: theme.richlink.fallbackBg,
        hoverBg: theme.richlink.fallbackBg,
        cursor: 'default' as const,
        opacity: 0.5,
    },
    other: {
        bg: theme.richlink.specializedBg,
        hoverBg: theme.richlink.specializedHoverBg,
        cursor: 'pointer' as const,
        opacity: 1,
    },
};

function EnvButton({info}: {info: EnvironmentInfo}) {
    const s = info.current ? STYLE.current : STYLE.other;

    return (
        <button
            disabled={info.current}
            onClick={() => navigateFromPopup(info.url)}
            onMouseEnter={(e) => {
                if (!info.current) e.currentTarget.style.backgroundColor = s.hoverBg;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = s.bg;
            }}
            style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: `1px solid ${theme.richlink.border}`,
                borderRadius: '4px',
                backgroundColor: s.bg,
                color: theme.text.white,
                cursor: s.cursor,
                opacity: s.opacity,
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
