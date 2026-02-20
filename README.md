# Ari's Chrome Exoskeleton

[![CI/CD](https://github.com/AriSweedler-at/chrome-extension-exoskeleton/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/AriSweedler-at/chrome-extension-exoskeleton/actions/workflows/ci-cd.yml)

Chrome extension that adds site-specific productivity tools via a tabbed popup.

## Installation

```bash
npm install
npm run dev
```

Load the extension:

1. Navigate to `chrome://extensions`
2. Enable Developer mode
3. Select "Load unpacked"
4. Choose the `dist/` directory

## Project Structure

```
src/
  index.tsx              # Content script entry point
  service-worker.tsx     # Background service worker entry point
  exo-tabs/              # Self-contained tab folders (auto-discovered via glob)
  lib/                   # Shared utilities (actions, clipboard, storage, etc.)
  popup/                 # Extension popup UI
  theme/                 # Design tokens (HSLA colors)
  test/                  # Test infrastructure (vitest setup)
```

Each tab lives in `src/exo-tabs/{name}/` with its own component, domain logic, content handler, and colocated tests. See `docs/adding-a-tab.md` for the full guide.

## Config Files

| File | Purpose |
|------|---------|
| `manifest.json` | Chrome extension manifest (permissions, entry points, keyboard shortcuts) |
| `package.json` | npm dependencies and scripts (dev, build, test, lint, format) |
| `package-lock.json` | Locked dependency versions |
| `tsconfig.json` | TypeScript config for IDE/LSP (includes test files for autocomplete) |
| `tsconfig.build.json` | TypeScript config for production builds (excludes test files) |
| `eslint.config.js` | Linter rules (no relative imports, no unused vars, no any) |
| `vite.config.ts` | Vite bundler config (React plugin, crx plugin, `@exo` path alias) |
| `vitest.config.ts` | Test runner config (jsdom environment, setup file, `@exo` path alias) |
| `.prettierrc` | Code formatter settings (single quotes, 4-space indent, 100 char width) |

## Development

```bash
npm run dev         # Start dev server with HMR
npm run build       # Production build
npm test            # Run tests in watch mode
npm run lint        # Run linter
npm run format      # Auto-format with prettier
npm run zip         # Build and package as extension.zip
```

See `docs/development.md` for details on HMR and debugging.

## Testing

Tests are colocated with source (`X.test.tsx` next to `X.tsx`). Uses Vitest with jsdom and sinon-chrome for Chrome API mocking.

```bash
npm test                # Watch mode
npm run test:coverage   # Generate coverage report
npm run test:ui         # Open Vitest UI
```

## Release Process

Update the version field in `manifest.json`. Commit and push to main. GitHub Actions runs tests, builds the extension, and creates a release with the ZIP artifact.

## License

MIT
