import {test, expect} from './fixtures';
import type {BrowserContext, Page} from '@playwright/test';

/**
 * These tests exercise the real content script in Chromium to prove two things
 * a unit test cannot:
 *   1. An exo keystroke actually fires end-to-end (the toast renders and the
 *      handler runs) — this is exactly what regressed when the toast threw.
 *   2. The underlying page NEVER receives an exo keystroke (capture phase +
 *      stopImmediatePropagation), while ordinary keys still reach the page.
 *
 * We serve a minimal "toy app" at a real GitHub PR URL so the content script
 * injects and registers its PR keybindings (c / f / ?). The toy app records
 * every keydown its own (main-world) window listener sees.
 */

declare global {
    interface Window {
        __seenKeys?: string[];
    }
}

const PR_URL = 'https://github.com/exo-test/repo/pull/1';

const TOY_HTML = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>toy app</title></head>
  <body>
    <h1 id="app">toy app</h1>
    <script>
      window.__seenKeys = [];
      window.addEventListener('keydown', (e) => {
        window.__seenKeys.push(e.key);
      });
    </script>
  </body>
</html>`;

/** Open the toy app at a PR URL and wait until the content script is listening. */
async function openToyPr(context: BrowserContext): Promise<Page> {
    const page = await context.newPage();
    await page.route(PR_URL, (route) => route.fulfill({contentType: 'text/html', body: TOY_HTML}));

    // The content entry runs all page modules (registering keybindings +
    // listen()) before logging this line, so it is a reliable readiness signal.
    const ready = page.waitForEvent('console', (msg) =>
        msg.text().includes('chrome exoskeleton loaded'),
    );
    await page.goto(PR_URL);
    await ready;
    return page;
}

const seenKeys = (page: Page) => page.evaluate(() => window.__seenKeys ?? []);

test.describe('exo keybindings (content script)', () => {
    test('fires its own shortcut and hides that keystroke from the page', async ({context}) => {
        const page = await openToyPr(context);

        // Control: an ordinary key is NOT intercepted and reaches the page.
        await page.keyboard.press('z');
        await expect.poll(() => seenKeys(page)).toContain('z');

        // Now an exo shortcut. '?' opens the help overlay (no navigation).
        await page.evaluate(() => (window.__seenKeys = []));
        await page.keyboard.press('Shift+Slash'); // '?'

        // (1) The toast renders — this is precisely what regressed: announce()
        //     must not throw before the handler is scheduled.
        await expect(page.getByText('exo keystroke', {exact: false})).toBeVisible();
        // (1b) The handler actually ran — the help overlay appeared.
        await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();

        // (2) The underlying page must NEVER have seen the '?' keystroke.
        expect(await seenKeys(page)).not.toContain('?');
    });

    test('Ctrl+V passes the next keystroke through to the page', async ({context}) => {
        const page = await openToyPr(context);

        // Without the prefix, an exo shortcut is intercepted — the page never
        // sees it.
        await page.keyboard.press('c');
        expect(await seenKeys(page)).not.toContain('c');

        // With the prefix, a banner appears and the next keystroke is handed
        // straight to the page.
        await page.evaluate(() => (window.__seenKeys = []));
        await page.keyboard.press('Control+v');
        await expect(page.getByText('pass-through', {exact: false})).toBeVisible();
        await page.keyboard.press('c');
        await expect.poll(() => seenKeys(page)).toContain('c');

        // A shifted key ('?' = Shift+Slash): the lone Shift must not consume the
        // arm, so the real '?' reaches the page.
        await page.evaluate(() => (window.__seenKeys = []));
        await page.keyboard.press('Control+v');
        await page.keyboard.press('?');
        await expect.poll(() => seenKeys(page)).toContain('?');
    });

    test('the f shortcut navigates to the Files changed tab', async ({context}) => {
        const page = await openToyPr(context);
        // Serve the destination so the navigation commits to a real document.
        await page.route(`${PR_URL}/changes`, (route) =>
            route.fulfill({contentType: 'text/html', body: TOY_HTML}),
        );

        await page.keyboard.press('f');
        await page.waitForURL(`${PR_URL}/changes`);
        expect(page.url()).toBe(`${PR_URL}/changes`);
    });
});
