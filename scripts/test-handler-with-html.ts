#!/usr/bin/env node
/**
 * Test Handler with HTML File
 *
 * This tool loads an HTML file, creates a DOM environment, and tests
 * a specific handler against it to see what rich link would be generated.
 *
 * Usage: npm run test-handler-html <handlerName> <htmlFilePath> [url]
 * Example: npm run test-handler-html GitHubHandler ~/Desktop/github.html https://github.com/Hyperbase/hyperbase/pull/200045
 */

import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

// Import handlers
import { GitHubHandler } from '@exo/library/richlink/handlers/github.handler';
import { GoogleDocsHandler } from '@exo/library/richlink/handlers/google-docs.handler';
import { AtlassianHandler } from '@exo/library/richlink/handlers/atlassian.handler';
import { AirtableHandler } from '@exo/library/richlink/handlers/airtable.handler';
import { SpinnakerHandler } from '@exo/library/richlink/handlers/spinnaker.handler';
import { SpaceliftHandler } from '@exo/library/richlink/handlers/spacelift.handler';
import { Handler } from '@exo/library/richlink/base';

const handlers: Record<string, new () => Handler> = {
    GitHubHandler,
    GoogleDocsHandler,
    AtlassianHandler,
    AirtableHandler,
    SpinnakerHandler,
    SpaceliftHandler,
};

async function testHandler(handlerName: string, htmlFilePath: string, url: string) {
    // Load HTML file
    const htmlPath = path.resolve(htmlFilePath);
    if (!fs.existsSync(htmlPath)) {
        console.error(`Error: HTML file not found: ${htmlPath}`);
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
    console.log(`✓ canHandle: ${canHandle}`);

    if (!canHandle) {
        console.log('\n⚠️  Handler cannot handle this URL');
        process.exit(0);
    }

    // Test format extraction
    try {
        const label = handler.getLabel();
        const html = await handler.getHtml();
        const text = await handler.getText();

        console.log('\n=== Rich Link Output ===');
        console.log(`Label: ${label}`);
        console.log(`HTML: ${html}`);
        console.log(`Text: ${text}`);
        console.log('');

        // Parse and show formatted output
        const htmlMatch = html.match(/<a href="([^"]+)">([^<]+)<\/a>/);
        if (htmlMatch) {
            console.log('=== Parsed HTML ===');
            console.log(`Link Text: ${htmlMatch[2]}`);
            console.log(`Link URL: ${htmlMatch[1]}`);
        }
    } catch (error) {
        console.error('\n❌ Error extracting format:');
        console.error(error);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: npm run test-handler-html <handlerName> <htmlFilePath> [url]');
    console.log('');
    console.log('Available handlers:');
    Object.keys(handlers).forEach(name => console.log(`  - ${name}`));
    process.exit(1);
}

const [handlerName, htmlFilePath, urlArg] = args;

// If URL not provided, try to extract from HTML file path or use a default
const url = urlArg || 'https://github.com/Hyperbase/hyperbase/pull/200045';

testHandler(handlerName, htmlFilePath, url);
