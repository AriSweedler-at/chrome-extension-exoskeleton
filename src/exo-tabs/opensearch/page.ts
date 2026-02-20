import {
    ExtractLogCommandAction,
    type ExtractLogCommandResult,
} from '@exo/exo-tabs/opensearch/action';
import {Clipboard} from '@exo/lib/clipboard';
import {Notifications, NotificationType} from '@exo/lib/toast-notification';
import {findOpenFlyout, buildCommand} from '@exo/exo-tabs/opensearch';

export async function handleExtractLogCommand(): Promise<ExtractLogCommandResult> {
    if (!findOpenFlyout()) {
        Notifications.show({message: 'No open log', type: NotificationType.Error});
        return {success: false, error: 'No open log'};
    }

    const cmd = buildCommand();
    if (!cmd) {
        Notifications.show({
            message: 'Missing hostname or msg fields',
            type: NotificationType.Error,
        });
        return {success: false, error: 'Missing hostname or msg fields'};
    }

    await Clipboard.write(cmd.flat);
    Notifications.show({
        message: 'Copied log fetch command',
        detail: cmd.display,
    });
    return {success: true, command: cmd.flat};
}

// Self-register: importing this module wires the handler
ExtractLogCommandAction.handle(handleExtractLogCommand);
