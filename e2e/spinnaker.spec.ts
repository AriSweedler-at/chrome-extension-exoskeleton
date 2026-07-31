import {test, expect} from './fixtures';
import type {BrowserContext, Page} from '@playwright/test';
import {
    openFixturePage,
    pressAndExpectToast,
    waitForKeybindings,
    toastContainer,
    seenKeys,
    resetSeenKeys,
} from './helpers';
import {
    SPINNAKER_URL,
    SPINNAKER_HTML,
    PIPELINE_NAME,
    STACKED_DETAILS_URL,
    STACKED_EXECUTION_ID,
    EXPANDING_DETAILS_URL,
    EXPANDED_CHILD_URL,
    CHILD_OF_DEPLOY_URL,
    CLIMB_PARENT_URL,
} from './fixture-pages';

/**
 * Drives the Spinnaker page-tab keybindings (e/i/d/M/G/gg) end-to-end against a
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

    test('d jumps to the isolated Deploy pipeline of the current environment', async ({
        context,
    }) => {
        const page = await openFixturePage(context, STACKED_DETAILS_URL, SPINNAKER_HTML);

        await pressAndExpectToast(page, 'd', 'Isolated pipeline: Deploy PRODUCTION');
        expect(page.url()).toBe(
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions' +
                '?q=Deploy%20PRODUCTION&pipeline=Deploy%20PRODUCTION',
        );
    });

    test('d refuses outside the hyperbase-deploy application', async ({context}) => {
        const page = await openSpinnaker(context);

        await pressAndExpectToast(page, 'd', 'Only works in the hyperbase-deploy application');
        expect(page.url()).toBe(SPINNAKER_URL);
    });

    test('M opens the OpenSearch links via the Monitoring Links stage', async ({context}) => {
        const page = await openFixturePage(context, STACKED_DETAILS_URL, SPINNAKER_HTML);

        await pressAndExpectToast(page, 'Shift+M', 'Opened 1 OpenSearch link');
        const clicks = await page.evaluate(() => window.__clicks ?? []);
        expect(clicks).toContain('opensearch-link');
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

    test('gg climbs from a child of a deploy to the stage that ran it', async ({context}) => {
        const page = await openFixturePage(context, CHILD_OF_DEPLOY_URL, SPINNAKER_HTML);
        await waitForKeybindings(page);

        await page.keyboard.press('g');
        await expect(toastContainer(page)).toContainText('pending');
        await page.keyboard.press('g');
        await expect(toastContainer(page)).toContainText(
            'Jumping to parent pipeline: K8s Meta Pipeline PRODUCTION',
        );

        // Breadcrumb first (stage=0), then the fixture's stage label click
        // selects the child's stage — like Deck.
        await page.waitForURL(CLIMB_PARENT_URL);
        await expect(toastContainer(page)).toContainText('Opened stage: Run sar-proxy pipeline');
        await expect
            .poll(() =>
                page.evaluate(
                    () =>
                        document.getElementById('last-pipeline-row')?.getBoundingClientRect()
                            .top ?? Number.NaN,
                ),
            )
            .toBeLessThan(2);
    });

    test('G expands a selected child pipeline, then scrolls to its row', async ({context}) => {
        const page = await openFixturePage(context, EXPANDING_DETAILS_URL, SPINNAKER_HTML);

        await pressAndExpectToast(
            page,
            'Shift+G',
            'Expanding child pipeline: Deploy taskworker PRODUCTION',
        );
        await page.waitForURL(EXPANDED_CHILD_URL);

        // The child's row renders async after the navigation; the composed
        // action scrolls it to the viewport top and toasts on the new view.
        await expect(page.locator('#notification-container')).toContainText(
            'Jumped to the last pipeline',
        );
        await expect
            .poll(() =>
                page.evaluate(
                    () =>
                        document.getElementById('child-pipeline-row')?.getBoundingClientRect()
                            .top ?? Number.NaN,
                ),
            )
            .toBeLessThan(2);
    });
});
