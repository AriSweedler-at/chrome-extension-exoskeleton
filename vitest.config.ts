import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/library/**/*.ts', 'src/actions/**/*.ts'],
            exclude: [
                '**/*.test.ts',
                '**/test-utils.ts',
                '**/*.d.ts',
                '**/library/index.ts',
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
            '@library': '/src/library',
            '@actions': '/src/actions',
            '@shared': '/src/shared',
        },
    },
});
