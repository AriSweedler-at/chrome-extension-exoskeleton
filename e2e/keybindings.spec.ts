import {test, expect} from './fixtures';
import type {BrowserContext, Page} from '@playwright/test';
import {openFixturePage, seenKeys, resetSeenKeys} from './helpers';
import {PR_URL, PR_HTML} from './fixture-pages';

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

const openToyPr = (context: BrowserContext): Promise<Page> =>
    openFixturePage(context, PR_URL, PR_HTML);

test.describe('exo keybindings (content script)', () => {
    test('fires its own shortcut and hides that keystroke from the page', async ({context}) => {
        const page = await openToyPr(context);

        // Control: an ordinary key is NOT intercepted and reaches the page.
        await page.keyboard.press('z');
        await expect.poll(() => seenKeys(page)).toContain('z');

        // Now an exo shortcut. '?' opens the help overlay (no navigation).
        await resetSeenKeys(page);
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
        await resetSeenKeys(page);
        await page.keyboard.press('Control+v');
        await expect(page.getByText('pass-through', {exact: false})).toBeVisible();
        await page.keyboard.press('c');
        await expect.poll(() => seenKeys(page)).toContain('c');

        // A shifted key ('?' = Shift+Slash): the lone Shift must not consume the
        // arm, so the real '?' reaches the page.
        await resetSeenKeys(page);
        await page.keyboard.press('Control+v');
        await page.keyboard.press('?');
        await expect.poll(() => seenKeys(page)).toContain('?');
    });

    test('the f shortcut navigates to the Files changed tab', async ({context}) => {
        // openFixturePage routes the whole origin, so the /changes destination
        // resolves to the same fixture and the navigation commits.
        const page = await openToyPr(context);

        await page.keyboard.press('f');
        await page.waitForURL(`${PR_URL}/changes`);
        expect(page.url()).toBe(`${PR_URL}/changes`);
    });
});
