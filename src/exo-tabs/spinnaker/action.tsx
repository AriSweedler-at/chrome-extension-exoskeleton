import {Action} from '@exo/lib/actions/base-action';

export type SpinnakerActionId = 'toggleExecution' | 'isolatePipeline';

/**
 * The popup's action table. Button label, kbd chip, and the message id all
 * derive from one row here — the same rows the page-side handler keys off —
 * so the popup's promise and the page's behavior cannot drift. No DOM
 * imports: the popup bundle must stay page-DOM-free.
 */
export const SPINNAKER_POPUP_ACTIONS: ReadonlyArray<{
    id: SpinnakerActionId;
    label: string;
    key: string;
}> = [
    {id: 'toggleExecution', label: 'Toggle Execution Details', key: 'e'},
    {id: 'isolatePipeline', label: 'Isolate Pipeline', key: 'i'},
];

/**
 * Popup → page request to run a Spinnaker action in the page's own context —
 * the identical function the matching keybinding runs.
 */
export class SpinnakerRunAction extends Action<{action: SpinnakerActionId}, void> {
    type = 'SPINNAKER_RUN_ACTION' as const;
}
