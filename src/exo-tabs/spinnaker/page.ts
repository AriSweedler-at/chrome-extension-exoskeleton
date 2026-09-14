import {keybindings} from '@exo/lib/keybindings';
import {makeEnvCycleBinding} from '@exo/lib/environments';
import {isTabEnabled} from '@exo/lib/popup-exo-tabs/use-tab-enablement';
import {
    toggleExecution,
    isolatePipeline,
    unisolatePipeline,
    isolateDeployPipeline,
    openMonitoringLinks,
    jumpToLastPipeline,
    climbToParentExecution,
} from '@exo/exo-tabs/spinnaker/actions';
import {isSpinnakerPage, getEnvironments} from '@exo/exo-tabs/spinnaker/url-match';
import {SpinnakerRunAction, type SpinnakerActionId} from '@exo/exo-tabs/spinnaker/action';

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
            key: 'I',
            modifiers: {shift: true},
            description: 'Un-isolate (clear the pipeline filter)',
            handler: unisolatePipeline,
            context: 'Spinnaker',
        },
        {
            key: 'd',
            description: 'Isolate the Deploy pipeline',
            handler: isolateDeployPipeline,
            context: 'Spinnaker',
        },
        {
            key: 'M',
            modifiers: {shift: true},
            description: 'Open the OpenSearch links (Monitoring Links stage)',
            handler: openMonitoringLinks,
            context: 'Spinnaker',
        },
        {
            key: 'G',
            modifiers: {shift: true},
            description: 'Jump to last pipeline in a stack',
            handler: jumpToLastPipeline,
            context: 'Spinnaker',
        },
        {
            sequence: ['g', 'g'],
            description: 'Climb to the parent execution',
            handler: climbToParentExecution,
            context: 'Spinnaker',
        },
        makeEnvCycleBinding({getEnvs: getEnvironments, context: 'Spinnaker'}),
    ]);
    keybindings.listen();

    // The popup's buttons run the same handlers as the keybindings, in the
    // same (page) context — button-click and keypress are one mechanism.
    SpinnakerRunAction.handle(async ({action}: {action: SpinnakerActionId}) => {
        const handlers = {toggleExecution, isolatePipeline} as const;
        await handlers[action]();
    });
}

initialize();
