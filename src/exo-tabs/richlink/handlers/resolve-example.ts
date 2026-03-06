/**
 * Shared file-resolution logic for CLI scripts (parse-html, test-handler-html).
 *
 * Bare filenames (no slashes) resolve from:
 *   1. handlers/examples/
 *   2. handlers/{subdir}/examples/  (e.g. airtable/examples/)
 */

import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = path.join(__dirname, 'examples');

/** An absolute path to an example HTML file. */
export type ExampleHtmlFilePath = string & {readonly __brand: 'ExampleHtmlFilePath'};

export const ExampleHtmlFile = {
    /** Resolve a bare filename or path to an absolute ExampleHtmlFilePath. */
    resolve(input: string): ExampleHtmlFilePath {
        if (!input.includes('/') && !input.includes('\\')) {
            const topLevel = path.join(EXAMPLES_DIR, input);
            if (fs.existsSync(topLevel)) return topLevel as ExampleHtmlFilePath;

            for (const entry of fs.readdirSync(__dirname, {withFileTypes: true})) {
                if (!entry.isDirectory() || entry.name === 'examples') continue;
                const subExamples = path.join(__dirname, entry.name, 'examples', input);
                if (fs.existsSync(subExamples)) return subExamples as ExampleHtmlFilePath;
            }
        }
        return path.resolve(input) as ExampleHtmlFilePath;
    },

    /** List all available example HTML files (bare filenames). */
    list(): ExampleHtmlFilePath[] {
        const files: ExampleHtmlFilePath[] = [];
        if (fs.existsSync(EXAMPLES_DIR)) {
            files.push(
                ...(fs
                    .readdirSync(EXAMPLES_DIR)
                    .filter((f) => f.endsWith('.html')) as ExampleHtmlFilePath[]),
            );
        }
        for (const entry of fs.readdirSync(__dirname, {withFileTypes: true})) {
            if (!entry.isDirectory() || entry.name === 'examples') continue;
            const subDir = path.join(__dirname, entry.name, 'examples');
            if (fs.existsSync(subDir)) {
                files.push(
                    ...(fs
                        .readdirSync(subDir)
                        .filter((f) => f.endsWith('.html')) as ExampleHtmlFilePath[]),
                );
            }
        }
        return files;
    },

    /** Check if a resolved path exists on disk. */
    exists(filePath: ExampleHtmlFilePath): boolean {
        return fs.existsSync(filePath);
    },

    /** Read the contents of an example HTML file. */
    read(filePath: ExampleHtmlFilePath): string {
        return fs.readFileSync(filePath, 'utf-8');
    },
};
