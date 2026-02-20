import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test-setup.tsx'],
        exclude: ['.worktrees/**', 'node_modules/**', 'dist/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/library/**/*.tsx', 'src/actions/**/*.tsx'],
            exclude: [
                '**/*.test.tsx',
                '**/test-utils.tsx',
                '**/*.d.ts',
                '**/library/index.tsx',
            ],
            thresholds: {
                lines: 80,
                functions: 100,
                branches: 80,
                statements: 80,
            },
        },
    },
    resolve: {
        alias: {
            '@exo': '/src',
        },
    },
});
