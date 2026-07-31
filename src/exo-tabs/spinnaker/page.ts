import {keybindings} from '@exo/lib/keybindings';
import {isTabEnabled} from '@exo/lib/popup-exo-tabs/use-tab-enablement';
import {
    toggleExecution,
    isolatePipeline,
    isolateDeployPipeline,
    jumpToLastPipeline,
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
            key: 'i',
            description: 'Isolate pipeline',
            handler: isolatePipeline,
            context: 'Spinnaker',
        },
        {
            key: 'd',
            description: 'Isolate the Deploy pipeline',
            handler: isolateDeployPipeline,
            context: 'Spinnaker',
        },
        {
            key: 'G',
            modifiers: {shift: true},
            description: 'Jump to last pipeline in a stack',
            handler: jumpToLastPipeline,
            context: 'Spinnaker',
        },
    ]);
    keybindings.listen();
}

initialize();
