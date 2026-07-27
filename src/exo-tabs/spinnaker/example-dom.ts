/**
 * Loader for saved real Spinnaker DOM snapshots.
 *
 * Snapshots live in src/exo-tabs/spinnaker/examples/*.html — gitignored, so
 * each machine saves its own (open a Spinnaker page, copy the DOM, then
 * `pbpaste > src/exo-tabs/spinnaker/examples/<name>.html`). Used by:
 *   - examples.test.ts: real-DOM tests that skip loudly when snapshots are absent
 *   - inspect-html.ts:  the `npm run spinnaker-html` iteration CLI
 */

import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EXAMPLES_DIR = path.join(__dirname, 'examples');

/** Resolve a bare filename against examples/; paths pass through. */
export function resolveExamplePath(input: string): string {
    if (!input.includes('/') && !input.includes('\\')) {
        return path.join(EXAMPLES_DIR, input);
    }
    return path.resolve(input);
}

/** Bare filenames of every saved snapshot on this machine. */
export function listExamples(): string[] {
    if (!fs.existsSync(EXAMPLES_DIR)) return [];
    return fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.html'));
}

/** Read a snapshot, or null (with the path) when it isn't saved locally. */
export function loadExampleHtml(name: string): string | null {
    const p = resolveExamplePath(name);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
}

/** One-line instruction for saving a missing snapshot. */
export function missingExampleHint(name: string): string {
    return (
        `Missing Spinnaker DOM snapshot: ${resolveExamplePath(name)} — ` +
        `open the matching Spinnaker view, copy its DOM (devtools: copy outerHTML), ` +
        `and save it there (e.g. pbpaste > ${path.join('src/exo-tabs/spinnaker/examples', name)})`
    );
}
