import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {navigateAndToast} from '@exo/lib/service-worker/navigate-with-toast';
import {makeEnvToast, EnvButtonRow, useEnvironments} from '@exo/lib/popup-exo-tabs/environment-ui';
import {OpenSearchComponent} from '@exo/exo-tabs/opensearch/OpenSearchComponent';
import {isOpenSearchPage, getEnvironments, getNextEnvironmentUrl} from '@exo/exo-tabs/opensearch';

const OpenSearchWithEnvs = () => {
    const envs = useEnvironments(getEnvironments);
    return (
        <>
            {envs && <EnvButtonRow envs={envs} />}
            <OpenSearchComponent />
        </>
    );
};

TabRegistry.register({
    id: 'opensearch',
    label: 'OpenSearch',
    component: OpenSearchWithEnvs,
    getPriority: (url: string) => {
        if (isOpenSearchPage(url)) return 0;
        return Number.MAX_SAFE_INTEGER;
    },
    primaryAction: async (tabId, url) => {
        const next = getNextEnvironmentUrl(url);
        if (!next) return false;
        const envs = getEnvironments(url);
        const nextEnv = envs?.find((e) => e.url === next);
        await navigateAndToast(tabId, next, makeEnvToast(nextEnv?.env ?? ''));
        return true;
    },
});
