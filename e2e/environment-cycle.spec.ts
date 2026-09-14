import {test, expect} from './fixtures';
import {openFixturePage, waitForKeybindings, seenKeys} from './helpers';
import {KEYLOGGER_SNIPPET, SPINNAKER_URL, SPINNAKER_HTML} from './fixture-pages';

/**
 * Shift+E cycles the page to the next environment. It runs entirely in the
 * page (window.location), so these tests drive the real content script and
 * watch the tab's URL change — no service worker involved.
 */

const SPACELIFT_ORIGIN = 'https://spacelift.shadowbox.cloud';
const STACK_HTML = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>toy stack</title></head>
  <body><h1>toy stack</h1>${KEYLOGGER_SNIPPET}</body>
</html>`;

test.describe('Shift+E environment cycling (content script)', () => {
    test('Spacelift: an alpha stack goes to its staging sibling', async ({context}) => {
        const page = await openFixturePage(
            context,
            `${SPACELIFT_ORIGIN}/stack/sendsafely-alpha`,
            STACK_HTML,
        );
        await waitForKeybindings(page);

        await page.keyboard.press('Shift+E');
        await page.waitForURL(`${SPACELIFT_ORIGIN}/stack/sendsafely-staging`);
    });

    test('Spacelift: off a stack page the key falls through to the page', async ({context}) => {
        const page = await openFixturePage(context, `${SPACELIFT_ORIGIN}/runs`, STACK_HTML);
        await waitForKeybindings(page);

        await page.keyboard.press('Shift+E');
        await expect.poll(() => seenKeys(page)).toContain('E');
        expect(page.url()).toBe(`${SPACELIFT_ORIGIN}/runs`);
    });

    test('Spinnaker: production wraps to alpha, keeping the execution route', async ({
        context,
    }) => {
        const page = await openFixturePage(context, SPINNAKER_URL, SPINNAKER_HTML);
        // The destination is another origin; serve the same fixture there so
        // the navigation commits.
        await page.route('https://spinnaker.k8s.alpha-shadowbox.cloud/**', (route) =>
            route.fulfill({contentType: 'text/html', body: SPINNAKER_HTML}),
        );

        // The Spinnaker module registers after an async enablement read, so
        // retry the (idempotent) press until the URL moves.
        await expect(async () => {
            await page.keyboard.press('Shift+E');
            await expect
                .poll(() => new URL(page.url()).hostname, {timeout: 500})
                .toBe('spinnaker.k8s.alpha-shadowbox.cloud');
        }).toPass({timeout: 5000});
        expect(new URL(page.url()).hash).toBe(new URL(SPINNAKER_URL).hash);
    });
});
