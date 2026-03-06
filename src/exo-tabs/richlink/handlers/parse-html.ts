#!/usr/bin/env node
/**
 * Parse HTML File — DOM Explorer for Handler Development
 *
 * Loads an HTML file into JSDOM and prints structured DOM information
 * so you can figure out what selectors to use for a new rich link handler.
 *
 * Shows:
 *   1. Page <title> and common Airtable selectors (basename, table name, etc.)
 *   2. All cell-editor elements — the Airtable detail-view fields (type + content)
 *   3. Leaf text nodes — meaningful content you might want to extract
 *
 * Usage:
 *   npm run parse-html <htmlFilePath>
 *
 * Bare filenames resolve from examples/ directories (same logic as test-handler-html).
 *
 * Examples:
 *   npm run parse-html airtable-security-exception.html
 *   npm run parse-html airtable-listable.html
 *   npm run parse-html ~/Desktop/some-page.html
 */

import {JSDOM} from 'jsdom';
import * as path from 'path';

import {ExampleHtmlFile} from '@exo/exo-tabs/richlink/handlers/resolve-example';

function truncate(s: string, max = 120): string {
    const oneLine = s.replace(/\s+/g, ' ').trim();
    return oneLine.length > max ? oneLine.slice(0, max) + '...' : oneLine;
}

function parseHtml(htmlFilePath: string) {
    const resolved = ExampleHtmlFile.resolve(htmlFilePath);
    if (!ExampleHtmlFile.exists(resolved)) {
        console.error(`Error: HTML file not found: ${resolved}`);
        process.exit(1);
    }

    const html = ExampleHtmlFile.read(resolved);
    const dom = new JSDOM(html, {url: 'https://example.com'});
    const doc = dom.window.document;

    console.log(`\n=== ${path.basename(resolved)} ===\n`);

    // 1. Page title and common selectors
    const title = doc.querySelector('title');
    console.log(`<title>: ${title?.textContent?.trim() ?? '(none)'}`);

    const knownSelectors: [string, string][] = [
        ['.basename', 'Base name'],
        ['[data-tutorial-selector-id="tableHeaderName"]', 'Table name'],
        ['.viewMenuButton', 'View name'],
    ];
    for (const [sel, label] of knownSelectors) {
        const el = doc.querySelector(sel);
        if (el?.textContent?.trim()) {
            console.log(`${label}: ${el.textContent.trim()}`);
        }
    }

    // 2. cell-editor elements (Airtable detail view fields)
    const cellEditors = doc.querySelectorAll('[data-testid="cell-editor"]');
    if (cellEditors.length > 0) {
        console.log(`\n--- ${cellEditors.length} cell-editor fields ---`);
        for (const ce of cellEditors) {
            const colType = ce.getAttribute('data-columntype') ?? '?';
            const heading = ce.querySelector('.heading-size-default');
            const headingText = heading ? truncate(heading.textContent ?? '') : null;
            const bodyText = truncate(ce.textContent ?? '', 150);
            const line = headingText
                ? `  [${colType}] heading: "${headingText}" | full: "${bodyText}"`
                : `  [${colType}] "${bodyText}"`;
            console.log(line);
        }
    }

    // 3. Leaf text nodes — non-trivial content
    console.log('\n--- Leaf text (first 60 unique, >5 chars) ---');
    const walker = doc.createTreeWalker(doc.body, 4 /* SHOW_TEXT */);
    let count = 0;
    const seen = new Set<string>();
    while (walker.nextNode() && count < 60) {
        const text = walker.currentNode.textContent?.trim() ?? '';
        if (text.length <= 5 || seen.has(text)) continue;
        seen.add(text);
        const parent = walker.currentNode.parentElement;
        if (!parent) continue;
        const tag = parent.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript') continue;

        const cls = parent.className
            ? `.${String(parent.className).replace(/\s+/g, '.').slice(0, 80)}`
            : '';
        const testId = parent.getAttribute('data-testid')
            ? `[data-testid="${parent.getAttribute('data-testid')}"]`
            : '';
        console.log(`  "${truncate(text, 80)}" — <${tag}${cls}${testId}>`);
        count++;
    }

    console.log('');
}

// --- CLI ---
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: npm run parse-html <htmlFilePath>');
    console.log('');
    console.log('Bare filenames resolve from handler examples/ directories.');

    const examples = ExampleHtmlFile.list();
    if (examples.length > 0) {
        console.log('\nAvailable example files:');
        for (const f of examples) console.log(`  ${f}`);
    }
    process.exit(1);
}

parseHtml(args[0]);
