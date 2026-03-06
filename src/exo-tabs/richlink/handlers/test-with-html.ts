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

import {ExampleHtmlFile} from '@exo/exo-tabs/richlink/handlers/resolve-example';

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

function testHandler(handlerName: string, htmlFilePath: string, url: string) {
    const resolved = ExampleHtmlFile.resolve(htmlFilePath);
    if (!ExampleHtmlFile.exists(resolved)) {
        console.error(`Error: HTML file not found: ${resolved}`);
        process.exit(1);
    }

    const html = ExampleHtmlFile.read(resolved);

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
    console.log(`HTML File: ${resolved}`);
    console.log('');

    const canHandle = handler.canHandle(new URL(url));
    console.log(`canHandle: ${canHandle}`);

    if (!canHandle) {
        console.log('\nHandler cannot handle this URL');
        process.exit(0);
    }

    // Test format extraction
    const formats = handler.getFormats({url});

    for (let i = 0; i < formats.length; i++) {
        const format = formats[i];
        console.log(`\n=== Format ${i + 1}/${formats.length} ===`);
        console.log(`Label:    ${format.label}`);
        console.log(`Priority: ${format.priority}`);
        console.log(`HTML:     ${format.html}`);
        console.log(`Text:     ${format.text}`);

        const htmlMatch = format.html.match(/<a href="([^"]+)">([^<]+)<\/a>/);
        if (htmlMatch) {
            console.log(`Parsed Link Text: ${htmlMatch[2]}`);
            console.log(`Parsed Link URL:  ${htmlMatch[1]}`);
        }
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

    const examples = ExampleHtmlFile.list();
    if (examples.length > 0) {
        console.log('');
        console.log('Example HTML files:');
        examples.forEach((f) => console.log(`  - ${f}`));
    }
    process.exit(1);
}

const [handlerName, htmlFilePath, urlArg] = args;
const url = urlArg || 'https://example.com';

testHandler(handlerName, htmlFilePath, url);
