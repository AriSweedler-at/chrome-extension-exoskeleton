/**
 * Guided demo: one headed browser window that walks through the extension's
 * page-side behaviors with narration banners and pauses, so a human can
 * actually watch what the e2e suite exercises.
 *
 *   npm run demo            # build + run
 *   DEMO_BEAT=3000 npm run demo   # linger longer on each step
 *
 * Not a test — no assertions. Uses the same fixture pages as the specs.
 */
import {chromium, type BrowserContext, type Page} from '@playwright/test';
import path from 'path';
import {PR_URL, PR_HTML, SPINNAKER_URL, SPINNAKER_HTML, EXECUTION_ID} from './fixture-pages';

const EXTENSION = path.resolve('dist');
const BEAT = Number(process.env.DEMO_BEAT ?? 2200);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Narrate a step: log to the terminal and show a banner in the page. */
async function narrate(page: Page, text: string): Promise<void> {
    console.log(`\n▶ ${text}`);
    await page.evaluate((message) => {
        let banner = document.getElementById('exo-demo-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'exo-demo-banner';
            banner.style.cssText = [
                'position: fixed',
                'top: 12px',
                'left: 50%',
                'transform: translateX(-50%)',
                'max-width: 80vw',
                'padding: 10px 18px',
                'background: rgba(20, 20, 30, 0.92)',
                'color: #fff',
                'font: 15px/1.4 sans-serif',
                'border-radius: 8px',
                'z-index: 2147483647',
                'box-shadow: 0 4px 16px rgba(0,0,0,0.4)',
            ].join(';');
            document.body.appendChild(banner);
        }
        banner.textContent = message;
    }, text);
    await sleep(BEAT);
}

async function openFixture(context: BrowserContext, url: string, html: string): Promise<Page> {
    const page = context.pages()[0] ?? (await context.newPage());
    const {origin} = new URL(url);
    await page.route(`${origin}/**`, (route) =>
        route.fulfill({contentType: 'text/html', body: html}),
    );
    const ready = page.waitForEvent('console', (msg) =>
        msg.text().includes('chrome exoskeleton loaded'),
    );
    await page.goto(url);
    await ready;
    // Page modules finish registering bindings after an async storage read.
    await sleep(400);
    return page;
}

async function press(page: Page, key: string, description: string): Promise<void> {
    await narrate(page, `Pressing '${key}' — ${description}`);
    await page.keyboard.press(key);
    await sleep(BEAT);
}

async function main() {
    console.log('Launching Chromium with the extension loaded...');
    const context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        headless: false,
        viewport: {width: 1200, height: 800},
        args: [`--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
    });

    // --- Scene 1: GitHub PR keybindings --------------------------------
    let page = await openFixture(context, PR_URL, PR_HTML);
    await narrate(
        page,
        'Scene 1 · A (toy) GitHub PR page. The content script injected and registered the c / f / ? shortcuts.',
    );
    await press(
        page,
        'Shift+Slash',
        "'?' opens the help overlay listing every registered shortcut",
    );
    await press(
        page,
        'Control+v',
        'arms the pass-through prefix — the banner says the next key goes to the page',
    );
    await press(page, 'c', "this 'c' passes through to the page instead of firing the exo binding");
    await narrate(page, "Now 'f' — it navigates this PR to the Files changed tab...");
    await page.keyboard.press('f');
    await page.waitForURL(`${PR_URL}/changes`);
    await narrate(page, `...and we landed on ${page.url()}`);

    // --- Scene 2: Spinnaker execution page ------------------------------
    page = await openFixture(context, SPINNAKER_URL, SPINNAKER_HTML);
    await narrate(
        page,
        `Scene 2 · A (toy) Spinnaker execution page for ${EXECUTION_ID}, with a failed-manifest error. Keys: e x i j p.`,
    );
    await press(page, 'Shift+Slash', 'the help overlay now lists the Spinnaker bindings');
    await press(page, 'e', 'clicks the "Execution Details" link — watch the error panel toggle');
    await press(page, 'e', 'toggles it back');
    await press(
        page,
        'x',
        'toasts the execution id parsed from the URL, and whether details are open',
    );
    await press(page, 'i', 'isolates this pipeline — watch the URL gain ?pipeline=<name>');
    await narrate(page, `URL is now: ${page.url()}`);
    await press(page, 'p', 'extracts the pod name from the error JSON and copies it');
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
        origin: new URL(SPINNAKER_URL).origin,
    });
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    await narrate(page, `Clipboard now contains: "${clipboard}"`);

    await narrate(page, 'Demo complete — closing in a few seconds. Re-run with: npm run demo');
    await sleep(4000);
    await context.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
