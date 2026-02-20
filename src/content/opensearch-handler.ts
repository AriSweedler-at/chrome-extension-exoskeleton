import {Clipboard} from '@library/clipboard';
import {Notifications} from '@library/notifications';
import type {ExtractLogCommandResult} from '../actions/extract-log-command.action';

function getFieldValue(fieldName: string): string | null {
    const el = document.querySelector(
        `[data-test-subj="tableDocViewRow-${fieldName}-value"]`,
    );
    return el ? el.textContent!.trim() : null;
}

interface CommandParts {
    flat: string;
    display: string;
}

function buildCommand(): CommandParts | null {
    const hostname =
        getFieldValue('agent.hostname') || getFieldValue('host.hostname');
    if (!hostname) return null;

    const msg = getFieldValue('msg');
    if (!msg) return null;

    const cluster = getFieldValue('kubernetesClusterName');
    const pod = getFieldValue('kubernetesPodName');

    const base = 'grunt admin:log_fetch:fetchMatchingLogMessageFromHost';
    const args: string[] = [`--hostname=${hostname}`];
    if (cluster) args.push(`--cluster=${cluster}`);
    if (pod) args.push(`--pod=${pod}`);
    args.push(`--search='${msg}'`);

    return {
        flat: `${base} ${args.join(' ')}`,
        display: `${base}\n${args.map((a) => `  ${a}`).join('\n')}`,
    };
}

export async function handleExtractLogCommand(): Promise<ExtractLogCommandResult> {
    const flyout =
        document.querySelector('[data-test-subj="osdDocTableDetailsParent"]') ||
        document.querySelector('[data-test-subj="documentDetailFlyOut"]');
    if (!flyout) {
        Notifications.showRichNotification('No open log', 'error');
        return {success: false, error: 'No open log'};
    }

    const cmd = buildCommand();
    if (!cmd) {
        Notifications.showRichNotification(
            'Missing hostname or msg fields',
            'error',
        );
        return {success: false, error: 'Missing hostname or msg fields'};
    }

    await Clipboard.write(cmd.flat);
    Notifications.showRichNotification('Copied log fetch command', 'success', 5000, {
        detail: cmd.display,
    });
    return {success: true, command: cmd.flat};
}
