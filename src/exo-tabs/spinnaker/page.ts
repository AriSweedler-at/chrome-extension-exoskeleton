import {keybindings} from '@exo/lib/keybindings';
import {isTabEnabled} from '@exo/lib/popup-exo-tabs/use-tab-enablement';
import {
    toggleExecution,
    displayActiveExecution,
    isolatePipeline,
    jumpToExecution,
    extractPodNames,
} from '@exo/exo-tabs/spinnaker/actions';
import {isSpinnakerPage} from '@exo/exo-tabs/spinnaker/url-match';

async function initialize() {
    if (!isSpinnakerPage(window.location.href)) return;
    if (!(await isTabEnabled('spinnaker'))) return;

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
            key: 'i',
            description: 'Isolate pipeline',
            handler: isolatePipeline,
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

initialize();
