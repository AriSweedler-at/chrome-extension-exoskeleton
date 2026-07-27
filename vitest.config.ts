import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.tsx'],
        exclude: ['.worktrees/**', 'node_modules/**', 'dist/**', 'e2e/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                '**/*.test.{ts,tsx}',
                '**/test-utils.tsx',
                '**/*.d.ts',
                'src/test/**',
                // Manual CLI harnesses, not exercised by the unit suite
                'src/exo-tabs/richlink/handlers/test-with-html.ts',
                'src/exo-tabs/richlink/handlers/resolve-example.ts',
                'src/exo-tabs/richlink/handlers/parse-html.ts',
                'src/exo-tabs/spinnaker/inspect-html.ts',
                'src/exo-tabs/spinnaker/example-dom.ts',
            ],
            thresholds: {
                lines: 78,
                functions: 77,
                branches: 66,
                statements: 77,
            },
        },
    },
    resolve: {
        alias: {
            '@exo': '/src',
        },
    },
});
