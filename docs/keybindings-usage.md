# Keybinding System Usage Guide

The keybinding system provides a data-driven approach to managing keyboard shortcuts with an auto-generated help overlay.

## Features

- **Data-driven**: Define keybindings as objects with key, description, and handler
- **Auto-generated help**: Press `?` to see all available keybindings
- **Context grouping**: Group related keybindings by context (e.g., "GitHub", "Spinnaker")
- **Smart filtering**: Automatically ignores INPUT/TEXTAREA elements
- **Modifier support**: Support for Ctrl, Shift, Alt, and Meta keys

## Basic Usage

### 1. Import the keybinding registry

```typescript
import { keybindings } from '../library/keybindings';
```

### 2. Register keybindings

```typescript
keybindings.registerAll([
    {
        key: 'e',
        description: 'Toggle execution details',
        handler: () => toggleExecution(),
        context: 'Spinnaker'
    },
    {
        key: 'x',
        description: 'Show active execution',
        handler: () => displayActiveExecution(),
        context: 'Spinnaker'
    }
]);
```

### 3. Start listening

```typescript
keybindings.listen();
```

### 4. Clean up when done

```typescript
// Unregister specific keybindings
keybindings.unregister('e');
keybindings.unregister('x');

// Stop listening
keybindings.unlisten();
```

## Keybinding Object Structure

```typescript
interface Keybinding {
  key: string;                    // The key to press (e.g., 'e', 'Enter', '?')
  description: string;            // Human-readable description
  handler: () => void;            // Function to call when key is pressed
  modifiers?: {                   // Optional modifier keys
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;               // Command on Mac, Windows key on PC
  };
  context?: string;               // Optional grouping (e.g., "GitHub", "Spinnaker")
}
```

## Examples

### Simple keybinding (no modifiers)

```typescript
keybindings.register({
    key: 'v',
    description: 'Mark current file as viewed',
    handler: () => markFileAsViewed(),
    context: 'GitHub PR'
});
```

### With modifier keys

```typescript
keybindings.register({
    key: 's',
    description: 'Save document',
    handler: () => saveDocument(),
    modifiers: { ctrl: true },
    context: 'Editor'
});
```

### Using in a React component

```typescript
import { useEffect } from 'react';
import { keybindings } from '../library/keybindings';

export function MyComponent() {
    useEffect(() => {
        // Register keybindings when component mounts
        keybindings.registerAll([
            {
                key: 'a',
                description: 'Action A',
                handler: () => console.log('Action A'),
                context: 'My Feature'
            },
            {
                key: 'b',
                description: 'Action B',
                handler: () => console.log('Action B'),
                context: 'My Feature'
            }
        ]);
        keybindings.listen();

        // Clean up when component unmounts
        return () => {
            keybindings.unregister('a');
            keybindings.unregister('b');
            keybindings.unlisten();
        };
    }, []);

    return <div>My Component</div>;
}
```

## Help Overlay

The help overlay is automatically available by pressing `?`. It:

- Groups keybindings by context
- Shows formatted key combinations (e.g., "Ctrl + S")
- Displays descriptions for each keybinding
- Can be closed by pressing ESC or clicking anywhere

No additional setup required - it's built into the keybinding registry!

## Migration from Manual Event Listeners

### Before (manual switch statement):

```typescript
useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        const key = event.key.toLowerCase();

        switch (key) {
            case 'e':
                event.preventDefault();
                toggleExecution();
                break;
            case 'x':
                event.preventDefault();
                displayActiveExecution();
                break;
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}, []);
```

### After (with keybinding registry):

```typescript
useEffect(() => {
    keybindings.registerAll([
        {
            key: 'e',
            description: 'Toggle execution details',
            handler: toggleExecution,
            context: 'Spinnaker'
        },
        {
            key: 'x',
            description: 'Show active execution',
            handler: displayActiveExecution,
            context: 'Spinnaker'
        }
    ]);
    keybindings.listen();

    return () => {
        keybindings.unregister('e');
        keybindings.unregister('x');
        keybindings.unlisten();
    };
}, []);
```

## Benefits

1. **No switch statements**: Keybindings are data objects, not code
2. **Automatic documentation**: The help overlay shows all available keys
3. **Centralized management**: All keybindings go through the registry
4. **Context awareness**: Built-in filtering for input elements
5. **Discoverability**: Users can press `?` to see what keys are available
