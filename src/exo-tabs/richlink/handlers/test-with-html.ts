#!/usr/bin/env node
/**
 * Test Handler with HTML File
 *
 * Loads an HTML file, creates a DOM environment, and tests a specific handler
 * against it to see what rich link would be generated.
 *
 * Usage: npm run test-handler-html <handlerName> <htmlFilePath> [url]
 *
 * If htmlFilePath is a bare filename (no slashes), it's resolved relative to
 * the examples/ directory next to this script.
 *
 * Examples:
 *   npm run test-handler-html AirtableHandler airtable-listable.html https://airtable.com/appXYZ/tblXYZ
 *   npm run test-handler-html GitHubHandler ~/Desktop/github.html https://github.com/org/repo/pull/123
 */

import {JSDOM} from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

// Import handlers
import {GitHubHandler} from '@exo/exo-tabs/richlink/handlers/github.handler';
import {GoogleDocsHandler} from '@exo/exo-tabs/richlink/handlers/google-docs.handler';
import {AtlassianHandler} from '@exo/exo-tabs/richlink/handlers/atlassian.handler';
import {AirtableHandler} from '@exo/exo-tabs/richlink/handlers/airtable.handler';
import {SpinnakerHandler} from '@exo/exo-tabs/richlink/handlers/spinnaker.handler';
import {SpaceliftHandler} from '@exo/exo-tabs/richlink/handlers/spacelift.handler';
import {BuildkiteHandler} from '@exo/exo-tabs/richlink/handlers/buildkite.handler';
import {Handler} from '@exo/exo-tabs/richlink/base';

const handlers: Record<string, new () => Handler> = {
    GitHubHandler,
    GoogleDocsHandler,
    AtlassianHandler,
    AirtableHandler,
    SpinnakerHandler,
    SpaceliftHandler,
    BuildkiteHandler,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = path.join(__dirname, 'examples');

/** Resolve a file path — bare filenames look in examples/ first. */
function resolveHtmlPath(input: string): string {
    // If the input has no directory component, try examples/ first
    if (!input.includes('/') && !input.includes('\\')) {
        const examplesPath = path.join(EXAMPLES_DIR, input);
        if (fs.existsSync(examplesPath)) return examplesPath;
    }
    return path.resolve(input);
}

function testHandler(handlerName: string, htmlFilePath: string, url: string) {
    // Load HTML file
    const htmlPath = resolveHtmlPath(htmlFilePath);
    if (!fs.existsSync(htmlPath)) {
        console.error(`Error: HTML file not found: ${htmlPath}`);
        if (!htmlFilePath.includes('/')) {
            console.error(`  (also checked ${path.join(EXAMPLES_DIR, htmlFilePath)})`);
        }
        process.exit(1);
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');

    // Create JSDOM environment
    const dom = new JSDOM(html, {
        url: url,
        runScripts: 'outside-only',
    });

    // Set up global document and window
    (global as Record<string, unknown>).document = dom.window.document;
    (global as Record<string, unknown>).window = dom.window;

    // Get handler
    const HandlerClass = handlers[handlerName];
    if (!HandlerClass) {
        console.error(`Error: Handler '${handlerName}' not found.`);
        console.error(`Available handlers: ${Object.keys(handlers).join(', ')}`);
        process.exit(1);
    }

    const handler = new HandlerClass();

    // Test canHandle
    console.log('\n=== Testing Handler ===');
    console.log(`Handler: ${handlerName}`);
    console.log(`URL: ${url}`);
    console.log(`HTML File: ${htmlPath}`);
    console.log('');

    const canHandle = handler.canHandle(url);
    console.log(`canHandle: ${canHandle}`);

    if (!canHandle) {
        console.log('\nHandler cannot handle this URL');
        process.exit(0);
    }

    // Test format extraction
    const format = handler.getFormat({url});

    console.log('\n=== Rich Link Output ===');
    console.log(`Label: ${format.label}`);
    console.log(`HTML:  ${format.html}`);
    console.log(`Text:  ${format.text}`);

    // Parse and show formatted output
    const htmlMatch = format.html.match(/<a href="([^"]+)">([^<]+)<\/a>/);
    if (htmlMatch) {
        console.log('\n=== Parsed ===');
        console.log(`Link Text: ${htmlMatch[2]}`);
        console.log(`Link URL:  ${htmlMatch[1]}`);
    }
    console.log('');
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: npm run test-handler-html <handlerName> <htmlFilePath> [url]');
    console.log('');
    console.log('htmlFilePath: absolute/relative path, or a bare filename to look in examples/');
    console.log('');
    console.log('Available handlers:');
    Object.keys(handlers).forEach((name) => console.log(`  - ${name}`));

    // List example files if any exist
    if (fs.existsSync(EXAMPLES_DIR)) {
        const examples = fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.html'));
        if (examples.length > 0) {
            console.log('');
            console.log('Example HTML files:');
            examples.forEach((f) => console.log(`  - ${f}`));
        }
    }
    process.exit(1);
}

const [handlerName, htmlFilePath, urlArg] = args;
const url = urlArg || 'https://example.com';

testHandler(handlerName, htmlFilePath, url);
