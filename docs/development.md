# Development Workflow

## Hot Module Replacement (HMR)

The extension uses `@crxjs/vite-plugin` which provides hot module replacement for Chrome extensions. This means you can see your changes instantly without manually rebuilding.

### Quick Start

```bash
npm run dev
```

Then load the extension:
1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` directory

### How It Works

When you run `npm run dev`, CRXJS will:
1. Output a development build to `dist/` with a WebSocket client injected
2. Watch your source files for changes
3. **Hot-reload** content scripts and popup changes instantly
4. **Auto-reload** the service worker when `background/index.tsx` changes
5. Update the extension without manual intervention

### What Gets Hot-Reloaded

| Change Type | Reload Behavior |
|-------------|----------------|
| Content scripts (`src/content/**`) | ⚡ Hot reload - changes appear instantly |
| Popup UI (`src/popup/**`) | ⚡ Hot reload - React fast refresh |
| Background script (`src/background/**`) | 🔄 Service worker reload |
| Library code (`src/library/**`) | ⚡ Hot reload for content/popup, 🔄 reload for background |
| Actions (`src/actions/**`) | ⚡ Hot reload for content/popup, 🔄 reload for background |

### Important Caveat

**Changes to `manifest.json` require a manual reload:**
1. Go to `chrome://extensions`
2. Click the reload icon on your extension card

Chrome doesn't support hot-reloading the manifest file itself.

### Development Tips

- **Keep the terminal open** - Vite will show you compilation errors and warnings
- **Watch the console** - Both the extension console and page console for debugging
- **Use React DevTools** - Works with the popup during development
- **Check the Network tab** - The WebSocket connection to Vite should stay open

### Troubleshooting

**Changes aren't appearing?**
- Check the terminal for build errors
- Verify the WebSocket connection is active (check browser console)
- Try manually reloading the extension at `chrome://extensions`

**Service worker issues?**
- Click "Inspect views: service worker" at `chrome://extensions` to see background logs
- Service workers may be stopped by Chrome - they restart automatically when needed

**Content script not injecting?**
- Check that the page URL isn't restricted (chrome://, chrome-extension://, etc.)
- Look for injection errors in the background service worker console

### Production Build

When you're ready to create a production build:

```bash
npm run build
npm run zip
```

This creates an optimized build in `dist/` and packages it as `extension.zip`.

## Releasing

### Version Bumping

Use `commit-and-tag-version` to bump the version in `package.json`, `package-lock.json`, and `manifest.json` simultaneously, update `CHANGELOG.md`, and create a tagged commit.

```bash
npm run bump          # auto-detect from conventional commits (feat → minor, fix → patch)
npm run bump:patch    # force patch  (0.2.1 → 0.2.2)
npm run bump:minor    # force minor  (0.2.1 → 0.3.0)
npm run bump:major    # force major  (0.2.1 → 1.0.0)
```

This will:
1. Bump the version in all three files
2. Generate/update `CHANGELOG.md` from conventional commit messages
3. Create a commit: `chore(release): X.Y.Z`
4. Create a git tag: `vX.Y.Z`

### Publishing a Release

After bumping, push to trigger the CI/CD release pipeline:

```bash
git push origin main --follow-tags
```

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) will:
1. Run tests and linting
2. Build the extension and create `extension.zip`
3. Detect the version change in `manifest.json`
4. Create a GitHub Release tagged `vX.Y.Z` with auto-generated release notes and the zip attached

### Changelog

`CHANGELOG.md` is auto-generated from conventional commit messages. Commits are grouped by type:

| Prefix | Section | Example |
|--------|---------|---------|
| `feat` | Features | `feat(richlink): add Spacelift handler` |
| `fix` | Bug Fixes | `fix(spinnaker): add error handling for URL parsing` |
| `refactor` | Refactors | `refactor: colocate tests with source` |
| `chore`, `test`, `docs`, `ci` | *(hidden)* | Not included in changelog |
