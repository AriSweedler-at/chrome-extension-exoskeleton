import {useState, useEffect} from 'react';
import {NotificationType} from '@exo/lib/toast-notification';
import type {ShowToastPayload} from '@exo/lib/actions/show-toast.action';
import {navigateAndToast} from '@exo/lib/service-worker/navigate-with-toast';
import {theme} from '@exo/theme/default';

export interface EnvironmentInfo {
    env: string;
    url: string;
    current: boolean;
}

export function makeEnvToast(envName: string): ShowToastPayload {
    return {
        message: `Navigating to ${envName}`,
        type: NotificationType.Success,
        duration: 2000,
    };
}

export async function navigateToEnv(url: string, envName: string): Promise<void> {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.id) return;
    await navigateAndToast(tab.id, url, makeEnvToast(envName));
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

export function EnvButton({info}: {info: EnvironmentInfo}) {
    const s = info.current ? STYLE.current : STYLE.other;

    return (
        <button
            disabled={info.current}
            onClick={() => navigateToEnv(info.url, info.env)}
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

export function EnvButtonRow({envs}: {envs: EnvironmentInfo[]}) {
    return (
        <div style={{padding: '16px', display: 'flex', gap: '8px'}}>
            {envs.map((info) => (
                <EnvButton key={info.env} info={info} />
            ))}
        </div>
    );
}

export function useEnvironments(
    getEnvs: (url: string) => EnvironmentInfo[] | undefined,
): EnvironmentInfo[] | undefined {
    const [envs, setEnvs] = useState<EnvironmentInfo[] | undefined>();

    useEffect(() => {
        const refresh = () => {
            chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
                if (tab?.url) setEnvs(getEnvs(tab.url));
            });
        };
        refresh();

        const onUpdated = (_tabId: number, info: chrome.tabs.TabChangeInfo) => {
            if (info.url) refresh();
        };
        chrome.tabs.onUpdated.addListener(onUpdated);
        return () => chrome.tabs.onUpdated.removeListener(onUpdated);
    }, [getEnvs]);

    return envs;
}
