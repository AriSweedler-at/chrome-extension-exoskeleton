import {keybindings} from '@exo/lib/keybindings';
import {
    toggleExecution,
    displayActiveExecution,
    displayActiveStage,
    jumpToExecution,
    extractPodNames,
} from '@exo/exo-tabs/spinnaker/actions';

// Only register on Spinnaker pages
if (window.location.href.toLowerCase().includes('spinnaker')) {
    keybindings.registerAll([
        {
            key: 'e',
            description: 'Toggle execution details',
            handler: toggleExecution,
            context: 'Spinnaker',
        },
        {
            key: 'x',
            description: 'Show active execution',
            handler: displayActiveExecution,
            context: 'Spinnaker',
        },
        {
            key: 's',
            description: 'Show active stage',
            handler: displayActiveStage,
            context: 'Spinnaker',
        },
        {
            key: 'j',
            description: 'Jump to execution',
            handler: jumpToExecution,
            context: 'Spinnaker',
        },
        {
            key: 'p',
            description: 'Extract pod names',
            handler: extractPodNames,
            context: 'Spinnaker',
        },
    ]);
    keybindings.listen();
}
