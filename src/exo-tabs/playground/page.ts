import {keybindings} from '@exo/lib/keybindings';
import {typeXxxAndScrollToBottom} from '@exo/exo-tabs/playground/actions';

// Active on all pages for now (testing the keybinding system)
keybindings.register({
    key: 'x',
    description: 'Type XXX and scroll to bottom',
    handler: typeXxxAndScrollToBottom,
    context: 'Playground',
});
keybindings.listen();
