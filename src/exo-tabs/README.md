# exo-tabs/

Each subdirectory is a self-contained tab. A tab's folder holds its registration (`tab.tsx`), component, domain logic, content handler, and tests.

## How it works

`index.tsx` uses `import.meta.glob('./*/tab.tsx', {eager: true})` to auto-discover and import every tab at build time. Adding a new tab is just creating a new folder with a `tab.tsx` that calls `TabRegistry.register()` — no other files need editing.

## Adding a new tab

```
src/exo-tabs/my-feature/
  tab.tsx              # TabRegistry.register() call
  tab.test.tsx         # registration tests
  MyComponent.tsx      # popup UI
  index.ts             # domain logic, URL matching
  content-handler.ts   # content script handler (if needed)
```

See `docs/adding-a-tab.md` for the full guide.
