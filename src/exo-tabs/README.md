# exo-tabs/

Each subdirectory is a self-contained exo-tab. An exo-tab's folder holds its
popup registration (`tab.tsx`), action contracts (`action.tsx`), page-side
wiring (`page.ts`), and domain logic + tests.

## How it works

**Popup side:** `index.tsx` uses `import.meta.glob('./*/tab.tsx', {eager: true})`
to auto-discover tab registrations.

**Page side:** `src/index.tsx` uses `import.meta.glob('./exo-tabs/*/page.ts', {eager: true})`
to auto-discover page modules. Each `page.ts` self-registers by calling
`Action.handle()` or initializing page-level behaviors at module level.

Adding a new tab requires no edits to any shared files.

## Adding a new tab

```
src/exo-tabs/my-feature/
  tab.tsx              # TabRegistry.register() — popup side
  tab.test.tsx         # registration tests
  MyComponent.tsx      # popup UI
  index.ts             # domain logic, URL matching
  action.tsx           # typed action contract (if needed)
  page.ts              # page-side wiring (if needed) — self-registering
```

See `docs/adding-a-tab.md` for the full guide.
