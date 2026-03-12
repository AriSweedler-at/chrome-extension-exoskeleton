# Changelog

All notable changes to Ari's Chrome Exoskeleton.

## [0.3.1](https://github.com/AriSweedler-at/chrome-extension-exoskeleton/compare/v0.3.0...v0.3.1) (2026-03-12)

### Bug Fixes

* **ci:** add `contents: write` permission to fix 403 on GitHub release creation
* **ci:** upgrade all GitHub Actions to latest (checkout/setup-node/artifact v6, gh-release v2)
* **ci:** bump CI Node.js from 20 to 24

## [0.3.0](https://github.com/AriSweedler-at/chrome-extension-exoskeleton/compare/v0.2.0...v0.3.0) (2026-03-12)

### Features

* **spacelift:** add environment rotation tab with navigate-with-toast ([#1](https://github.com/AriSweedler-at/chrome-extension-exoskeleton/issues/1))
* **richlink:** add Airtable security exception handler and parse-html tool
* **richlink:** add Spacelift, Spinnaker, Atlassian, Google Docs, Buildkite handlers
* **richlink:** add handler registry with priority sorting and auto-discovery
* **richlink:** add RichLinkComponent with format list, copy counter, and keyboard shortcut (Cmd+Shift+C)
* **spinnaker:** add tab with DOM utilities, URL parsing, pod extractor, and action handlers
* add GitHub PR autoscroll tab with auto-run support
* add OpenSearch log fetch command extractor tab
* add SO SPRINT tab for Airtable page
* add clouddev-term tab for terminal font override
* add data-driven keybinding system with help overlay
* add TabRegistry with priority-based primary action dispatch (Cmd+Shift+X)
* add TabBar component with storage-backed selection
* add toast notification system with timer bar, hover pinning, and click-to-dismiss
* add Playwright e2e testing
* add TabEnablementSection component with auto-inject for tabs with enablementToggle

### Bug Fixes

* **richlink:** use hostname parsing in all handler canHandle methods
* **richlink:** avoid redundant stack name in Spacelift rich links
* keybinding registry ignores implicit shift for non-letter keys
* strip sub-pages (/files, /changes, etc.) from GitHub PR rich links
* CopyCounter uses chrome.storage.local instead of localStorage
* various URL parsing, test coverage, and race condition fixes

### Refactors

* auto-discover tabs and rich link handlers via import.meta.glob
* ban all relative imports, convert everything to @exo/* aliases
* colocate components and tests with tabs
* centralize colors into theme (HSLA format)
* simplify action/content-handler architecture with auto-discovery
* DRY rich link handlers with base class for getHtml/getText

## [0.2.0](https://github.com/AriSweedler-at/chrome-extension-exoskeleton/compare/v0.1.0...v0.2.0) (2026-01-13)

Initial working extension with popup UI, background service worker, content script, and action handler system.

## [0.1.0](https://github.com/AriSweedler-at/chrome-extension-exoskeleton/commits/v0.1.0) (2026-01-13)

Project scaffolding, configuration, and Chrome extension manifest.
