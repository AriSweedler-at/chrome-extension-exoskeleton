# Chrome Extension Starter

TypeScript Chrome extension starter with reusable library, testing, and CI/CD.

## Features

- TypeScript with strict mode
- React popup UI
- Vite bundler with HMR
- Vitest test runner
- Class-based action system for type-safe messaging
- Chrome API utility library (clipboard, storage, notifications, commands)
- GitHub Actions workflow
- ESLint and Prettier

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

## Example Extension

The starter includes a working counter extension. Press `Ctrl+Shift+I` or click the popup button to increment. Counter resets on page navigation.

## Project Structure

```
src/
├── library/        Reusable Chrome API utilities
├── actions/        Extension-specific message actions
├── popup/          React UI components
├── background/     Service worker entry point
├── content/        Content script entry point
└── shared/         Shared types and constants

tests/              Unit and component tests
```

## Library API

**Actions**

Define actions as classes extending `Action<TPayload, TResult>`:

```typescript
class IncrementAction extends Action<{amount: number}, {count: number}> {
    type = 'INCREMENT' as const;
}

// In content script
IncrementAction.setContext(context);
IncrementAction.handle(async (payload, sender, context) => {
    context.count += payload.amount;
    return {count: context.count};
});

// In popup
const result = await IncrementAction.sendToActiveTab({amount: 1});
```

**Utilities**

```typescript
Clipboard.write(text: string, html?: string): Promise<void>
Notifications.show(message: string, duration?: number): void
Storage.get<T>(key: string): Promise<T>
Storage.set(key: string, value: any): Promise<void>
Commands.getAll(): Promise<chrome.commands.Command[]>
Commands.onCommand(callback: (command: string) => void): void
```

## Development

```bash
npm run dev         # Start dev server with HMR
npm test            # Run tests in watch mode
npm run lint        # Run ESLint
npm run build       # Build for production
npm run zip         # Create distribution ZIP
```

## Testing

Tests use Vitest with jsdom and sinon-chrome for Chrome API mocking.

```bash
npm test                # Watch mode
npm run test:coverage   # Generate coverage report
npm run test:ui         # Open Vitest UI
```

## Release Process

Update the version field in `manifest.json`. Commit and push to main. GitHub Actions runs tests, builds the extension, and creates a release with the ZIP artifact.

## License

MIT
