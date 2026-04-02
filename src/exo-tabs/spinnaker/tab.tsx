import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {navigateAndToast} from '@exo/lib/service-worker/navigate-with-toast';
import {makeEnvToast, EnvButtonRow, useEnvironments} from '@exo/lib/popup-exo-tabs/environment-ui';
import {SpinnakerContent} from '@exo/exo-tabs/spinnaker/SpinnakerComponent';
import {
    isSpinnakerPage,
    getEnvironments,
    getNextEnvironmentUrl,
} from '@exo/exo-tabs/spinnaker/url-match';

const SpinnakerWithEnvs = () => {
    const envs = useEnvironments(getEnvironments);
    return (
        <>
            {envs && <EnvButtonRow envs={envs} />}
            <SpinnakerContent />
        </>
    );
};

TabRegistry.register({
    id: 'spinnaker',
    label: 'Spinnaker',
    component: SpinnakerWithEnvs,
    enablementToggle: true,
    primaryAction: async (tabId, url) => {
        const next = getNextEnvironmentUrl(url);
        if (!next) return false;
        const envs = getEnvironments(url);
        const nextEnv = envs?.find((e) => e.url === next);
        await navigateAndToast(tabId, next, makeEnvToast(nextEnv?.env ?? ''));
        return true;
    },
    getPriority: (url: string) => {
        if (isSpinnakerPage(url)) return 0;
        return Number.MAX_SAFE_INTEGER;
    },
});
