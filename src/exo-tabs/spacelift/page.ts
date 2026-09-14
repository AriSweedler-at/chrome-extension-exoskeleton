import {keybindings} from '@exo/lib/keybindings';
import {makeEnvCycleBinding} from '@exo/lib/environments';
import {isSpaceliftPage, getEnvironments} from '@exo/exo-tabs/spacelift';

// Spacelift is an SPA: register on the whole site and let the binding's
// `when` guard keep Shift+E transparent off stack pages.
function initialize(): void {
    if (!isSpaceliftPage(window.location.href)) return;

    keybindings.register(
        makeEnvCycleBinding({
            getEnvs: getEnvironments,
            context: 'Spacelift',
            // Toast the destination stack's name, not just the bare env name.
            label: (next) => new URL(next.url).pathname.split('/').pop() ?? '',
        }),
    );
    keybindings.listen();
}

initialize();
