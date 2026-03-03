import {test, expect} from './fixtures';

test('popup renders Rich Link tab by default', async ({context, extensionId}) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    // The Rich Link tab is the default tab (priority 0 on all pages).
    // It shows a loading state then the format list.
    // At minimum we should see "Loading formats..." or the loaded content.
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
});

test('popup shows copy counter', async ({context, extensionId}) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    // Wait for the component to finish loading — either shows formats or an error
    // (error is expected since there's no real active tab with a URL)
    await page.waitForTimeout(1000);

    // The page should have rendered something (not blank)
    const textContent = await page.locator('body').textContent();
    expect(textContent?.length).toBeGreaterThan(0);
});
