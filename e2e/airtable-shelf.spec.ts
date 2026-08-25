import type {Page} from '@playwright/test';
import {test, expect} from './fixtures';
import {openFixturePage, expectToast} from './helpers';

const APP_ID = 'apptivTqaoebkrmV1';
const DETAIL = Buffer.from(
    JSON.stringify({
        pageId: 'pagZzlssmtCQlD48M',
        rowId: 'recT5SYpFJs1ECUSK',
        showComments: false,
        queryOriginHint: null,
    }),
).toString('base64');
const SHELF_URL = `https://airtable.com/${APP_ID}/pagrDMUXa6uRzU6f6?detail=${DETAIL}&SHDHb=rec4hPuRRvCu4oGcT`;
const FULLSCREEN_PATH = `/${APP_ID}/pagZzlssmtCQlD48M/recT5SYpFJs1ECUSK`;

const PAGE_HTML = `<!DOCTYPE html>
<html>
<head><title>Listable Fixture</title></head>
<body><h1>Shelf</h1></body>
</html>`;

/** Each navigation reloads the content script; wait for it before pressing. */
const contentScriptReady = (page: Page) =>
    page.waitForEvent('console', (msg) => msg.text().includes('chrome exoskeleton loaded'));

test.describe("Airtable shelf isolation ('i' / 'I')", () => {
    test('i isolates the shelf to fullscreen, and I returns to the shelf', async ({context}) => {
        const page = await openFixturePage(context, SHELF_URL, PAGE_HTML);

        let ready = contentScriptReady(page);
        await page.keyboard.press('i');
        await page.waitForURL((url) => url.pathname === FULLSCREEN_PATH);
        await ready;

        ready = contentScriptReady(page);
        await page.keyboard.press('Shift+I');
        await page.waitForURL(
            (url) =>
                url.pathname === `/${APP_ID}/pagrDMUXa6uRzU6f6` &&
                url.searchParams.get('detail') === DETAIL,
        );
        await ready;
    });

    test('i falls through on the fullscreen view (no shelf open)', async ({context}) => {
        const page = await openFixturePage(
            context,
            `https://airtable.com${FULLSCREEN_PATH}`,
            PAGE_HTML,
        );

        await page.keyboard.press('i');

        // The when-guard leaves 'i' to the page: no navigation, no toast.
        await page.waitForTimeout(300);
        expect(new URL(page.url()).pathname).toBe(FULLSCREEN_PATH);
        await expect(
            page.locator('#exo-notification-container .chrome-ext-notification'),
        ).toHaveCount(0);
    });

    test('I errors on a fullscreen view not entered via isolation', async ({context}) => {
        const page = await openFixturePage(
            context,
            `https://airtable.com${FULLSCREEN_PATH}`,
            PAGE_HTML,
        );

        await page.keyboard.press('Shift+I');

        await expectToast(
            page,
            "Can't return to a shelf — this fullscreen view wasn't opened via isolate (i)",
        );
        expect(new URL(page.url()).pathname).toBe(FULLSCREEN_PATH);
    });
});
