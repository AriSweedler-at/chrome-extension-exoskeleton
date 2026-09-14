import {
    ExtractLogCommandAction,
    type ExtractLogCommandResult,
} from '@exo/exo-tabs/opensearch/action';
import {Clipboard} from '@exo/lib/clipboard';
import {Notifications, NotificationType} from '@exo/lib/toast-notification';
import {
    findOpenFlyout,
    buildCommand,
    getEnvironments,
    isOpenSearchPage,
} from '@exo/exo-tabs/opensearch';
import {keybindings} from '@exo/lib/keybindings';
import {makeEnvCycleBinding} from '@exo/lib/environments';
import {theme} from '@exo/theme/default';

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
        children: (
            <pre
                style={{
                    ...theme.toast.detail,
                    margin: '8px 0 0 0',
                    whiteSpace: 'pre',
                    lineHeight: '1.5',
                }}
            >
                {cmd.display}
            </pre>
        ),
    });
    return {success: true, command: cmd.flat};
}

// Self-register: importing this module wires the handler
ExtractLogCommandAction.handle(handleExtractLogCommand);

if (isOpenSearchPage(window.location.href)) {
    keybindings.register(makeEnvCycleBinding({getEnvs: getEnvironments, context: 'OpenSearch'}));
    keybindings.listen();
}
