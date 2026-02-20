#!/usr/bin/env node
/**
 * Test Autoscroll File Detection
 *
 * Loads an HTML file and tests what files the autoscroll detects
 */

import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

function testFileDetection(htmlFilePath: string) {
    // Load HTML file
    const htmlPath = path.resolve(htmlFilePath);
    if (!fs.existsSync(htmlPath)) {
        console.error(`Error: HTML file not found: ${htmlPath}`);
        process.exit(1);
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');

    // Create JSDOM environment
    const dom = new JSDOM(html, {
        url: 'https://github.com/Hyperbase/hyperbase/pull/200045/changes',
        runScripts: 'outside-only',
    });

    global.document = dom.window.document as any;
    global.window = dom.window as any;

    console.log('\n=== Testing File Detection ===\n');

    // Helper function to extract filename (mimics getFileName from autoscroll)
    function getFileName(fileElement: Element): string {
        // Method 1: data attributes
        const dataPath =
            fileElement.getAttribute('data-path') || fileElement.getAttribute('data-tagsearch-path');
        if (dataPath) return dataPath;

        // Method 2: Look for file path in links or spans with title attributes
        const titleEl = fileElement.querySelector('[title]');
        if (titleEl && titleEl.getAttribute('title')) {
            const title = titleEl.getAttribute('title')!;
            // Skip generic titles
            if (!title.includes('Viewed') && !title.includes('Toggle') && !title.includes('diff')) {
                return title;
            }
        }

        // Method 3: Look for filename in text content of specific selectors
        const filenameSelectors = [
            'a[href*="/blob/"]',
            '.file-info a',
            '[data-testid="file-header"] a',
            '.js-file-line-container a',
        ];

        for (const selector of filenameSelectors) {
            const el = fileElement.querySelector(selector);
            if (el && el.textContent && el.textContent.trim()) {
                return el.textContent.trim();
            }
        }

        // Method 4: Look for any link that looks like a file path
        const links = fileElement.querySelectorAll('a');
        for (const link of links) {
            const text = link.textContent?.trim();
            if (text && (text.includes('/') || text.includes('.'))) {
                return text;
            }
        }

        return 'unknown file';
    }

    // Test: New DiffFileHeader-module selector
    console.log('0. Testing DiffFileHeader-module__diff-file-header selector:');
    const diffFileHeaders = Array.from(
        document.querySelectorAll('[class*="DiffFileHeader-module__diff-file-header__"]')
    );
    console.log(`   DiffFileHeaders found: ${diffFileHeaders.length}`);
    diffFileHeaders.forEach((header, i) => {
        console.log(`   File ${i}:`);
        console.log(`      Tag: ${header.tagName}`);
        console.log(`      Filename: ${getFileName(header)}`);
        console.log(`      Classes: ${header.className.substring(0, 100)}...`);
    });

    // Test: Diff-module__diffHeaderWrapper selector
    console.log('\n1. Testing Diff-module__diffHeaderWrapper selector:');
    const container = document.querySelector('[data-hpc="true"] .d-flex.flex-column.gap-3');
    console.log(`   Container found: ${!!container}`);

    if (container) {
        const diffHeaderWrappers = Array.from(
            container.querySelectorAll('[class*="Diff-module__diffHeaderWrapper--"]')
        );
        console.log(`   Wrappers in container: ${diffHeaderWrappers.length}`);
        diffHeaderWrappers.forEach((wrapper, i) => {
            const firstChild = wrapper.firstElementChild;
            console.log(`   Wrapper ${i}: firstChild = ${firstChild?.tagName}, classes = ${firstChild?.className}`);
        });
    }

    // Test: Global diff header wrapper search
    console.log('\n2. Testing global Diff-module__diffHeaderWrapper selector:');
    const globalDiffHeaderWrappers = Array.from(
        document.querySelectorAll('[class*="Diff-module__diffHeaderWrapper--"]')
    );
    console.log(`   Global wrappers found: ${globalDiffHeaderWrappers.length}`);
    globalDiffHeaderWrappers.forEach((wrapper, i) => {
        const firstChild = wrapper.firstElementChild;
        console.log(`   Wrapper ${i}: firstChild = ${firstChild?.tagName}, classes = ${firstChild?.className}`);

        // Try to extract filename
        const dataPath = firstChild?.getAttribute('data-path') || firstChild?.getAttribute('data-tagsearch-path');
        if (dataPath) {
            console.log(`      -> File: ${dataPath}`);
        } else {
            // Look for title attribute
            const titleEl = firstChild?.querySelector('[title]');
            if (titleEl) {
                const title = titleEl.getAttribute('title');
                console.log(`      -> Title: ${title}`);
            }

            // Look for links
            const links = firstChild?.querySelectorAll('a');
            if (links) {
                console.log(`      -> Links found: ${links.length}`);
                links.forEach((link, j) => {
                    console.log(`         Link ${j}: text="${link.textContent?.trim()}", href="${link.href}"`);
                });
            }
        }
    });

    // Test: Fallback selectors
    console.log('\n3. Testing fallback selectors:');
    const fallbackSelectors = [
        '[data-testid*="file"]',
        '[data-tagsearch-path]',
        '[data-path]',
        '.file-header',
        '.file',
        '.js-file',
    ];

    for (const selector of fallbackSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) {
            console.log(`   ${selector}: ${elements.length} elements`);
            elements.forEach((el, i) => {
                const testId = el.getAttribute('data-testid');
                const path = el.getAttribute('data-path');
                const tagsearch = el.getAttribute('data-tagsearch-path');
                console.log(`      Element ${i}: ${el.tagName}`);
                console.log(`         testid: ${testId}`);
                console.log(`         data-path: ${path}`);
                console.log(`         data-tagsearch-path: ${tagsearch}`);
                console.log(`         text: "${el.textContent?.substring(0, 80).trim()}..."`);
            });
        }
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: npm run test-autoscroll <htmlFilePath>');
    process.exit(1);
}

const [htmlFilePath] = args;
testFileDetection(htmlFilePath);
