import {describe, it, expect, vi, beforeEach} from 'vitest';
import {handleExtractLogCommand} from '@exo/exo-tabs/opensearch/content-handler';

// Mock Clipboard
vi.mock('@exo/lib/clipboard', () => ({
    Clipboard: {
        write: vi.fn().mockResolvedValue(undefined),
    },
}));

// Mock Notifications
vi.mock('@exo/lib/toast-notification', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@exo/lib/toast-notification')>();
    return {
        ...actual,
        Notifications: {
            show: vi.fn(),
        },
    };
});

import {Clipboard} from '@exo/lib/clipboard';
import {Notifications} from '@exo/lib/toast-notification';

function setUpFlyout(fields: Record<string, string>) {
    // Create the flyout container
    const flyout = document.createElement('div');
    flyout.setAttribute('data-test-subj', 'osdDocTableDetailsParent');

    // Create field value elements
    for (const [fieldName, value] of Object.entries(fields)) {
        const el = document.createElement('div');
        el.setAttribute('data-test-subj', `tableDocViewRow-${fieldName}-value`);
        el.textContent = value;
        flyout.appendChild(el);
    }

    document.body.appendChild(flyout);
    return flyout;
}

describe('handleExtractLogCommand', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('returns error when no flyout is open', async () => {
        const result = await handleExtractLogCommand();

        expect(result.success).toBe(false);
        expect(result.error).toBe('No open log');
        expect(Notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({message: 'No open log'}),
        );
    });

    it('returns error when hostname is missing', async () => {
        setUpFlyout({
            msg: 'some log message',
        });

        const result = await handleExtractLogCommand();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing hostname or msg fields');
    });

    it('returns error when msg is missing', async () => {
        setUpFlyout({
            'agent.hostname': 'ip-172-19-149-187',
        });

        const result = await handleExtractLogCommand();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing hostname or msg fields');
    });

    it('builds command with all fields', async () => {
        setUpFlyout({
            'agent.hostname': 'ip-172-19-149-187',
            kubernetesClusterName: 'production-use1-worker-canary-002',
            kubernetesPodName: 'worker-service-dogfood-crd-stable-7f69c6d6b-mj8w6',
            msg: 'Perm (Query Auth): permission denied',
        });

        const result = await handleExtractLogCommand();

        expect(result.success).toBe(true);
        expect(result.command).toBe(
            "grunt admin:log_fetch:fetchMatchingLogMessageFromHost --hostname=ip-172-19-149-187 --cluster=production-use1-worker-canary-002 --pod=worker-service-dogfood-crd-stable-7f69c6d6b-mj8w6 --search='Perm (Query Auth): permission denied'",
        );
        expect(Clipboard.write).toHaveBeenCalledWith(result.command!);
        // Clipboard gets the flat (single-line) command
        expect(result.command).not.toContain('\n');
        expect(Notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Copied log fetch command',
                detail: expect.stringContaining('--hostname='),
            }),
        );
    });

    it('builds command without cluster and pod', async () => {
        setUpFlyout({
            'agent.hostname': 'ip-10-0-1-100',
            msg: 'Error: connection refused',
        });

        const result = await handleExtractLogCommand();

        expect(result.success).toBe(true);
        expect(result.command).toBe(
            "grunt admin:log_fetch:fetchMatchingLogMessageFromHost --hostname=ip-10-0-1-100 --search='Error: connection refused'",
        );
    });

    it('falls back to host.hostname when agent.hostname is missing', async () => {
        setUpFlyout({
            'host.hostname': 'ip-10-0-2-200',
            msg: 'some message',
        });

        const result = await handleExtractLogCommand();

        expect(result.success).toBe(true);
        expect(result.command).toContain('--hostname=ip-10-0-2-200');
    });

    it('prefers agent.hostname over host.hostname', async () => {
        setUpFlyout({
            'agent.hostname': 'ip-preferred',
            'host.hostname': 'ip-fallback',
            msg: 'test',
        });

        const result = await handleExtractLogCommand();

        expect(result.success).toBe(true);
        expect(result.command).toContain('--hostname=ip-preferred');
    });
});
