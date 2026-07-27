import {test, expect} from './fixtures';
import type {BrowserContext, Page} from '@playwright/test';
import {
    openFixturePage,
    pressAndExpectToast,
    readClipboardText,
    seenKeys,
    resetSeenKeys,
    KEYLOGGER_SNIPPET,
} from './helpers';

/**
 * Drives the Spinnaker page-tab keybindings (e/x/s/j/p) end-to-end against a
 * fixture that mimics the execution-details DOM the actions target. This is
 * the iteration loop for the Spinnaker tab: change an action, save real
 * Spinnaker DOM into the fixture, re-run.
 */

const EXECUTION_ID = '01HPN64GE091GK831P0XG2JQQT';
const SPINNAKER_URL =
    `https://spinnaker.k8s.shadowbox.cloud/#/applications/myapp/executions/${EXECUTION_ID}` +
    `?stage=1&step=0&details=deployStatus`;

// A k8s manifest dump with metadata fields in real (alphabetical) order —
// labels precede name, which the pod extractor must tolerate.
const ERROR_BODY = `Exception ( Wait For Manifest To Stabilize )
{"kind":"Pod","metadata":{"labels":{"app":"hyperbase"},"name":"h-bg-provision-step-0-abc12","namespace":"prod"},"status":{"phase":"Failed"}}`;

const SPINNAKER_HTML = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>myapp - executions - Spinnaker</title></head>
  <body>
    <div class="execution-group">
      <a class="clickable" id="exec-details-link">Execution Details</a>
      <div class="execution-details-container">
        <div class="alert alert-danger"><pre>${ERROR_BODY}</pre></div>
      </div>
    </div>
    <script>
      window.__clicks = [];
      document.getElementById('exec-details-link')
        .addEventListener('click', () => window.__clicks.push('exec-details'));
    </script>
    ${KEYLOGGER_SNIPPET}
  </body>
</html>`;

const openSpinnaker = (context: BrowserContext): Promise<Page> =>
    openFixturePage(context, SPINNAKER_URL, SPINNAKER_HTML);

test.describe('spinnaker keybindings (content script)', () => {
    test('e toggles execution details by clicking the link', async ({context}) => {
        const page = await openSpinnaker(context);

        await pressAndExpectToast(page, 'e', 'Toggled execution details');
        const clicks = await page.evaluate(() => window.__clicks ?? []);
        expect(clicks).toContain('exec-details');
    });

    test('x shows the active execution id and open state', async ({context}) => {
        const page = await openSpinnaker(context);

        await pressAndExpectToast(page, 'x', `Execution: ${EXECUTION_ID} (open)`);

        // Now that the binding is confirmed active, a fresh press must be
        // hidden from the page (earlier retry presses may have leaked while
        // the page module was still registering).
        await resetSeenKeys(page);
        await page.keyboard.press('x');
        expect(await seenKeys(page)).not.toContain('x');
    });

    test('s shows the active stage from the hash query params', async ({context}) => {
        const page = await openSpinnaker(context);

        await pressAndExpectToast(page, 's', 'Stage 1: deployStatus');
    });

    test('p extracts the pod name from the error and copies it', async ({context}) => {
        const page = await openSpinnaker(context);

        await pressAndExpectToast(page, 'p', 'Copied pod name: h-bg-provision-step-0-abc12');
        expect(await readClipboardText(page)).toBe('h-bg-provision-step-0-abc12');
    });

    test('p reports when there is no error container', async ({context}) => {
        const bareHtml = SPINNAKER_HTML.replace(/<div class="alert alert-danger">.*?<\/div>/s, '');
        const page = await openFixturePage(context, SPINNAKER_URL, bareHtml);

        await pressAndExpectToast(page, 'p', 'No error container found');
    });
});
