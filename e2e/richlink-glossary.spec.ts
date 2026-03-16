import {test, expect} from './fixtures';
import fs from 'fs';
import path from 'path';

const GLOSSARY_OLD_STYLE_HTML = fs.readFileSync(
    path.resolve(
        'src/exo-tabs/richlink/handlers/airtable/airtable-handlers/glossary/examples/airtable-glossary-old-style.html',
    ),
    'utf-8',
);

const GLOSSARY_INTERFACES_HTML = fs.readFileSync(
    path.resolve(
        'src/exo-tabs/richlink/handlers/airtable/airtable-handlers/glossary/examples/airtable-glossary-interfaces.html',
    ),
    'utf-8',
);

const OLD_STYLE_URL =
    'https://airtable.com/appebZJp08MytrQhs/tblZwrY3sfRYng3IH/viwO9fiYOTdoKPmvM/recK1hqBktQeDGchN?blocks=hide';
const INTERFACES_URL =
    'https://airtable.com/appebZJp08MytrQhs/pagagsZtQRDbx4O5u?ACh2y=recK1hqBktQeDGchN';

interface Format {
    label: string;
    priority: number;
    html: string;
    text: string;
    isFallback?: boolean;
}

/** Load a fixture HTML at a given URL and get richlink formats via the service worker. */
async function getFormats(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any,
    fixtureHtml: string,
    url: string,
): Promise<Format[]> {
    const page = await context.newPage();
    await page.route('**/*airtable.com/**', (route: {fulfill: (opts: {contentType: string; body: string}) => void}) =>
        route.fulfill({contentType: 'text/html', body: fixtureHtml}),
    );
    await page.goto(url);
    await page.waitForTimeout(2000);

    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');

    const result = await sw.evaluate(async (targetUrl: string) => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find((t: chrome.tabs.Tab) => t.url?.includes('airtable.com'));
        if (!tab?.id) return {success: false, error: 'no tab'};
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(
                tab.id!,
                {type: 'GET_FORMATS', payload: {url: targetUrl}},
                (resp: unknown) => {
                    if (chrome.runtime.lastError) {
                        resolve({success: false, error: chrome.runtime.lastError.message});
                    } else {
                        resolve(resp);
                    }
                },
            );
        });
    }, url);

    await page.close();
    return ((result as {data?: Format[]})?.data ?? []) as Format[];
}

test.describe('Airtable Glossary richlink handler', () => {
    test('produces glossary format on old-style record page', async ({context}) => {
        const formats = await getFormats(context, GLOSSARY_OLD_STYLE_HTML, OLD_STYLE_URL);
        const glossary = formats.find((f) => f.label === 'Airtable Glossary');

        expect(glossary).toBeDefined();
        expect(glossary!.html).toContain('SSP: Single-Service Pipeline');
        expect(glossary!.html).toContain('recK1hqBktQeDGchN');
    });

    test('produces glossary format on interfaces page', async ({context}) => {
        const formats = await getFormats(context, GLOSSARY_INTERFACES_HTML, INTERFACES_URL);
        const glossary = formats.find((f) => f.label === 'Airtable Glossary');

        expect(glossary).toBeDefined();
        expect(glossary!.html).toContain('SSP: Single-Service Pipeline');
    });

    test('canonicalizes interfaces URL to record permalink', async ({context}) => {
        const formats = await getFormats(context, GLOSSARY_INTERFACES_HTML, INTERFACES_URL);
        const canonicalUrl = 'https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN';

        // Airtable-specific formats should use the canonical URL
        const airtableFormats = formats.filter((f) => !f.isFallback);
        expect(airtableFormats.length).toBeGreaterThan(0);
        for (const f of airtableFormats) {
            expect(f.html).toContain(canonicalUrl);
        }
    });

    test('ignores stray richText cells from list panel', async ({context}) => {
        const formats = await getFormats(context, GLOSSARY_INTERFACES_HTML, INTERFACES_URL);
        const glossary = formats.find((f) => f.label === 'Airtable Glossary');

        expect(glossary).toBeDefined();
        expect(glossary!.html).not.toContain('Container Runtime Interface');
        expect(glossary!.html).not.toContain('Multi Cluster Reconciler');
    });
});
