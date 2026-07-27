import {keybindings} from '@exo/lib/keybindings';
import {isTabEnabled} from '@exo/lib/popup-exo-tabs/use-tab-enablement';
import {typeXxxAndScrollToBottom} from '@exo/exo-tabs/playground/actions';

async function initialize() {
    if (!window.location.href.includes('docs.google.com/document')) return;
    if (!(await isTabEnabled('playground'))) return;

    keybindings.register({
        key: 'x',
        description: 'Type XXX and scroll to bottom',
        handler: typeXxxAndScrollToBottom,
        context: 'Playground',
    });
    keybindings.listen();
}

initialize();
