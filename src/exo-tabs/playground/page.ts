import {keybindings} from '@exo/lib/keybindings';
import {typeXxxAndScrollToBottom} from '@exo/exo-tabs/playground/actions';

if (window.location.href.includes('docs.google.com/document')) {
    keybindings.register({
        key: 'x',
        description: 'Type XXX and scroll to bottom',
        handler: typeXxxAndScrollToBottom,
        context: 'Playground',
    });
    keybindings.listen();
}
