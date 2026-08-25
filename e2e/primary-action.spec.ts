import {test, expect} from './fixtures';
import {openFixturePage, expectToast} from './helpers';

const PAGE_URL = 'https://example.com/plain-page';
const PAGE_HTML = `<!DOCTYPE html>
<html>
<head><title>Plain Page</title></head>
<body><h1>Hello</h1></body>
</html>`;

test('Cmd+Shift+X round-trips through the service worker to the fallback toast', async ({
    context,
}) => {
    const page = await openFixturePage(context, PAGE_URL, PAGE_HTML);

    // No exo tab matches example.com, so the service worker's dispatcher
    // sends its deterministic fallback toast back to this tab — proving the
    // whole keystroke → runtime message → dispatch → SHOW_TOAST loop.
    await expect(async () => {
        await page.keyboard.press('Meta+Shift+X');
        await expectToast(page, /No primary action available/);
    }).toPass({timeout: 5000});
});
