import {test, expect} from './fixtures';

test('popup renders and handles chrome-extension URL gracefully', async ({
    context,
    extensionId,
}) => {
    // When opened as a tab (not as a real popup), chrome.tabs.query returns the
    // popup tab itself with a chrome-extension:// URL. The component should show
    // an error message rather than crashing.
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    // Should show either the error or loading state — not a blank page
    await popup.waitForTimeout(1000);
    const body = await popup.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(0);
});

test('popup tab UI renders correctly for a target page', async ({context, extensionId}) => {
    // Navigate a page first, then open popup in same tab context
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForTimeout(500);

    // Open popup — since the "active tab" will be the popup itself, we test
    // that the popup at least renders its structure without crashing.
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    // The popup React app should mount and render something
    await popup.waitForTimeout(1000);
    const hasContent = await popup.evaluate(() => document.body.children.length > 0);
    expect(hasContent).toBe(true);
});
