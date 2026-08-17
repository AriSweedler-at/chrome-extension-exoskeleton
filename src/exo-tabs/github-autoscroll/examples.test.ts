import {describe, it, expect, afterEach} from 'vitest';
import {
    listExamples,
    loadExampleHtml,
    missingExampleHint,
} from '@exo/exo-tabs/github-autoscroll/example-dom';
import {
    getViewedToggles,
    markGeneratedFilesViewed,
    isGeneratedFile,
} from '@exo/exo-tabs/github-autoscroll';

/**
 * Real-DOM tests: run the GitHub PR DOM helpers against saved snapshots of
 * actual PR pages (src/exo-tabs/github-autoscroll/examples/*.html).
 *
 * Snapshots are gitignored — machine-local. When none are saved, this suite
 * skips with a loud hint instead of failing: committed tests must not depend
 * on uncommitted files.
 */

const EXAMPLES = listExamples();

if (EXAMPLES.length === 0) {
    console.warn(
        `[github-autoscroll real-DOM tests] no snapshots found — suite skipped.\n` +
            missingExampleHint('ghpr-with-dinghyfile-changes.html'),
    );
}

describe.skipIf(EXAMPLES.length === 0)('GitHub PR helpers against real DOM snapshots', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe.each(EXAMPLES)('%s', (name) => {
        function installDom(): void {
            const html = loadExampleHtml(name);
            if (!html) throw new Error(missingExampleHint(name));
            document.body.innerHTML = html;
        }

        it('finds a Viewed toggle with a full path for every rendered diff', () => {
            installDom();
            const toggles = getViewedToggles();
            expect(toggles.length).toBeGreaterThan(0);
            for (const toggle of toggles) {
                expect(toggle.path, 'path resolves').toContain('/');
                expect(toggle.path, 'no LRM junk').not.toContain('\u200e');
                expect(toggle.path).not.toContain('Copy file name');
            }
        });

        it('marks every unviewed generated file as viewed', () => {
            installDom();
            if (!name.includes('dinghy')) return; // snapshot without generated files

            const generated = getViewedToggles().filter((t) => isGeneratedFile(t.path));
            expect(generated.length).toBeGreaterThan(0);
            const unviewedBefore = generated.filter((t) => !t.viewed).length;

            const result = markGeneratedFilesViewed();

            expect(result.marked).toBe(unviewedBefore);
            expect(result.alreadyViewed).toBe(generated.length - unviewedBefore);
        });
    });
});
