import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {navigateAndToast} from '@exo/lib/service-worker/navigate-with-toast';
import {makeEnvToast, EnvButtonRow, useEnvironments} from '@exo/lib/popup-exo-tabs/environment-ui';
import {
    isSpaceliftStackPage,
    getEnvironments,
    getNextEnvironmentUrl,
} from '@exo/exo-tabs/spacelift';

const SpaceliftComponent = () => {
    const envs = useEnvironments(getEnvironments);
    if (!envs) return null;
    return <EnvButtonRow envs={envs} />;
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
        const stackName = new URL(next).pathname.split('/').pop() ?? '';
        await navigateAndToast(tabId, next, makeEnvToast(stackName));
        return true;
    },
});
