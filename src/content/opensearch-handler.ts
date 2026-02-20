import {Clipboard} from '@library/clipboard';
import {Notifications, NotificationType} from '@library/notifications';
import {findOpenFlyout, buildCommand} from '@library/opensearch';
import type {ExtractLogCommandResult} from '@actions/extract-log-command.action';

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
