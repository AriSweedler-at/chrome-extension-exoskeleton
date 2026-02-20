import {Commands} from '@library/commands';
import {CopyRichLinkAction} from '../actions/copy-rich-link.action';
import {ExtractLogCommandAction} from '../actions/extract-log-command.action';
import {isGitHubPRChangesPage} from '../library/github-autoscroll';
import {isOpenSearchPage} from '../tabs/opensearch.tab';

/**
 * Command handlers for keyboard shortcuts
 */

async function toggleGithubAutoscroll() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab.id) {
        try {
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'GITHUB_AUTOSCROLL_TOGGLE',
            });
            console.log(
                'GitHub autoscroll toggled via keyboard shortcut, active:',
                response.active,
            );
        } catch (error) {
            console.error('Failed to toggle GitHub autoscroll:', error);
        }
    }
}

async function copyRichLink() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab.id && tab.url) {
        try {
            await CopyRichLinkAction.sendToTab(tab.id, {url: tab.url});
            console.log('Rich link copied via keyboard shortcut');
        } catch (error) {
            console.error('Failed to copy rich link:', error);
        }
    }
}


async function extractLogCommand() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab.id) {
        try {
            await ExtractLogCommandAction.sendToTab(tab.id, undefined as void);
        } catch (error) {
            console.error('Failed to extract log command:', error);
        }
    }
}

async function dispatchPrimaryAction() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab.url) return;

    if (isGitHubPRChangesPage(tab.url)) {
        await toggleGithubAutoscroll();
    } else if (isOpenSearchPage(tab.url)) {
        await extractLogCommand();
    } else {
        await copyRichLink();
    }
}

/**
 * Initialize command handlers for keyboard shortcuts
 */
export function initializeCommandHandlers(): void {
    Commands.onCommand(async (command) => {
        console.log('Command received:', command);

        switch (command) {
            case 'copy-rich-link':
                await copyRichLink();
                break;
            case 'primary-action':
                await dispatchPrimaryAction();
                break;
        }
    });
}
