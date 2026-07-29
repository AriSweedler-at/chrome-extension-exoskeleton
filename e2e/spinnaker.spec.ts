import {test, expect} from './fixtures';
import type {BrowserContext, Page} from '@playwright/test';
import {openFixturePage, pressAndExpectToast, seenKeys, resetSeenKeys} from './helpers';
import {
    SPINNAKER_URL,
    SPINNAKER_HTML,
    PIPELINE_NAME,
    STACKED_DETAILS_URL,
    STACKED_EXECUTION_ID,
} from './fixture-pages';

/**
 * Drives the Spinnaker page-tab keybindings (e/i) end-to-end against a
 * fixture that mimics the execution-details DOM the actions target. This is
 * the iteration loop for the Spinnaker tab: change an action, save real
 * Spinnaker DOM into the fixture, re-run.
 */

const openSpinnaker = (context: BrowserContext): Promise<Page> =>
    openFixturePage(context, SPINNAKER_URL, SPINNAKER_HTML);

test.describe('spinnaker keybindings (content script)', () => {
    test('e toggles execution details by clicking the link', async ({context}) => {
        const page = await openSpinnaker(context);

        await pressAndExpectToast(page, 'e', 'Toggled execution details');
        const clicks = await page.evaluate(() => window.__clicks ?? []);
        expect(clicks).toContain('exec-details');
    });

    test('i isolates the pipeline by adding the pipeline filter to the URL', async ({context}) => {
        const page = await openSpinnaker(context);

        await pressAndExpectToast(page, 'i', `Isolated pipeline: ${PIPELINE_NAME}`);
        expect(page.url()).toContain('pipeline=Blue%20Green%20Provisioning%20PRODUCTION');
        // The rest of the hash query is preserved.
        expect(page.url()).toContain('stage=1&step=0&details=deployStatus');

        // Now that the binding is confirmed active, a fresh press must be
        // hidden from the page (earlier retry presses may have leaked while
        // the page module was still registering).
        await resetSeenKeys(page);
        await page.keyboard.press('i');
        expect(await seenKeys(page)).not.toContain('i');
    });

    test('i on a stacked details view jumps to the pipeline’s own application', async ({
        context,
    }) => {
        const page = await openFixturePage(context, STACKED_DETAILS_URL, SPINNAKER_HTML);

        await pressAndExpectToast(
            page,
            'i',
            'Isolated pipeline: Deploy worker-assigner PRODUCTION (worker-assigner)',
        );
        expect(page.url()).toContain(
            `/applications/worker-assigner/executions/${STACKED_EXECUTION_ID}`,
        );
        expect(page.url()).toContain('pipeline=Deploy%20worker-assigner%20PRODUCTION');
        expect(page.url()).toContain('stage=0&step=0&details=webhookConfig');
        expect(page.url()).not.toContain('/details/');
    });

    test('G scrolls the last stacked pipeline row to the top of the viewport', async ({
        context,
    }) => {
        const page = await openSpinnaker(context);

        // 'G' has no outcome toast; the keystroke announce toast is the
        // signal that the binding is registered and fired. Playwright's
        // press('G') does not hold Shift, so press the chord explicitly.
        await pressAndExpectToast(page, 'Shift+G', 'Jump to last pipeline');

        // The handler is deferred past the announce toast's paint — poll.
        await expect
            .poll(() =>
                page.evaluate(() =>
                    Math.abs(
                        document.getElementById('last-pipeline-row')!.getBoundingClientRect().top,
                    ),
                ),
            )
            .toBeLessThan(2);
    });
});
