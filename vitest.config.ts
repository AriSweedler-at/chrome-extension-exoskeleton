import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/library/**/*.ts', 'src/actions/**/*.ts'],
            exclude: ['**/*.test.ts', '**/test-utils.ts', '**/*.d.ts'],
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
