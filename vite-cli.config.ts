import {defineConfig} from 'vite';

/** Minimal Vite config for CLI scripts (vite-node). Omits crxjs plugin. */
export default defineConfig({
    resolve: {
        alias: {
            '@exo': '/src',
        },
    },
});
