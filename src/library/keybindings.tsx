import {theme} from '../theme/default';

/**
 * Keybinding Registry Library
 *
 * Provides a data-driven keybinding system with auto-generated help overlay.
 * Features:
 * - Register keybindings as objects with key, description, and handler
 * - Automatic event listener setup
 * - Auto-generated help overlay with '?' key
 * - Context-aware filtering (skips INPUT/TEXTAREA elements)
 */

export interface Keybinding {
  key: string;
  description: string;
  handler: () => void;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  context?: string; // Optional grouping context (e.g., "GitHub", "Spinnaker")
}

export class KeybindingRegistry {
  private keybindings: Map<string, Keybinding> = new Map();
  private helpOverlay: HTMLElement | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    // Auto-register the help keybinding
    this.register({
      key: '?',
      description: 'Show this help overlay',
      handler: () => this.showHelp(),
      context: 'Global'
    });
  }

  /**
   * Register a keybinding
   */
  register(keybinding: Keybinding): void {
    const key = this.getKeySignature(keybinding);
    this.keybindings.set(key, keybinding);
  }

  /**
   * Register multiple keybindings at once
   */
  registerAll(keybindings: Keybinding[]): void {
    keybindings.forEach(kb => this.register(kb));
  }

  /**
   * Unregister a keybinding
   */
  unregister(key: string, modifiers?: Keybinding['modifiers']): void {
    const signature = this.getKeySignature({ key, modifiers } as Keybinding);
    this.keybindings.delete(signature);
  }

  /**
   * Start listening for keybindings
   */
  listen(): void {
    if (this.keydownHandler) {
      return; // Already listening
    }

    this.keydownHandler = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const signature = this.getKeySignature({
        key: event.key,
        modifiers: {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
          meta: event.metaKey
        }
      } as Keybinding);

      const keybinding = this.keybindings.get(signature);
      if (keybinding) {
        event.preventDefault();
        keybinding.handler();
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Stop listening for keybindings
   */
  unlisten(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  /**
   * Generate a unique signature for a keybinding
   */
  private getKeySignature(keybinding: Pick<Keybinding, 'key' | 'modifiers'>): string {
    const modifiers = keybinding.modifiers || {};
    const parts: string[] = [];

    if (modifiers.ctrl) parts.push('ctrl');
    if (modifiers.shift) parts.push('shift');
    if (modifiers.alt) parts.push('alt');
    if (modifiers.meta) parts.push('meta');
    parts.push(keybinding.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * Format a keybinding for display
   */
  private formatKeybinding(keybinding: Keybinding): string {
    const modifiers = keybinding.modifiers || {};
    const parts: string[] = [];

    if (modifiers.ctrl) parts.push('Ctrl');
    if (modifiers.shift) parts.push('Shift');
    if (modifiers.alt) parts.push('Alt');
    if (modifiers.meta) parts.push('⌘');
    parts.push(keybinding.key.toUpperCase());

    return parts.join(' + ');
  }

  /**
   * Show the help overlay
   */
  showHelp(): void {
    if (this.helpOverlay) {
      return; // Already showing
    }

    // Group keybindings by context
    const grouped = new Map<string, Keybinding[]>();
    this.keybindings.forEach(kb => {
      const context = kb.context || 'Other';
      if (!grouped.has(context)) {
        grouped.set(context, []);
      }
      grouped.get(context)!.push(kb);
    });

    // Create overlay
    this.helpOverlay = document.createElement('div');
    this.helpOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${theme.overlay.dark};
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: ${theme.shadow.overlay};
    `;

    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Keyboard Shortcuts';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
      color: ${theme.text.primary};
    `;
    content.appendChild(title);

    // Add keybindings grouped by context
    grouped.forEach((keybindings, context) => {
      // Add context header
      const contextHeader = document.createElement('h3');
      contextHeader.textContent = context;
      contextHeader.style.cssText = `
        margin: 16px 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: ${theme.text.secondary};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      content.appendChild(contextHeader);

      // Add keybindings for this context
      keybindings.forEach(kb => {
        const row = document.createElement('div');
        row.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid ${theme.border.separator};
        `;

        const desc = document.createElement('span');
        desc.textContent = kb.description;
        desc.style.cssText = `
          flex: 1;
          color: ${theme.text.dark};
          font-size: 14px;
        `;

        const keyDisplay = document.createElement('kbd');
        keyDisplay.textContent = this.formatKeybinding(kb);
        keyDisplay.style.cssText = `
          background: ${theme.bg.cardSubtle};
          border: 1px solid ${theme.border.medium};
          border-radius: 4px;
          padding: 4px 8px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          color: ${theme.text.dark};
          white-space: nowrap;
          margin-left: 16px;
        `;

        row.appendChild(desc);
        row.appendChild(keyDisplay);
        content.appendChild(row);
      });
    });

    // Add close instruction
    const closeHint = document.createElement('p');
    closeHint.textContent = 'Press ESC or click anywhere to close';
    closeHint.style.cssText = `
      margin: 20px 0 0 0;
      text-align: center;
      color: ${theme.text.muted};
      font-size: 12px;
    `;
    content.appendChild(closeHint);

    this.helpOverlay.appendChild(content);
    document.body.appendChild(this.helpOverlay);

    // Close on click or ESC
    const closeHandler = (event?: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') {
        return;
      }
      this.hideHelp();
    };

    this.helpOverlay.addEventListener('click', closeHandler);
    document.addEventListener('keydown', closeHandler);

    // Store cleanup handler
    (this.helpOverlay as any)._closeHandler = closeHandler;
  }

  /**
   * Hide the help overlay
   */
  hideHelp(): void {
    if (!this.helpOverlay) {
      return;
    }

    const closeHandler = (this.helpOverlay as any)._closeHandler;
    if (closeHandler) {
      document.removeEventListener('keydown', closeHandler);
    }

    this.helpOverlay.remove();
    this.helpOverlay = null;
  }

  /**
   * Get all registered keybindings
   */
  getAll(): Keybinding[] {
    return Array.from(this.keybindings.values());
  }

  /**
   * Clear all keybindings (except help)
   */
  clear(): void {
    const helpKey = this.getKeySignature({ key: '?', modifiers: {} } as Keybinding);
    const helpBinding = this.keybindings.get(helpKey);
    this.keybindings.clear();
    if (helpBinding) {
      this.keybindings.set(helpKey, helpBinding);
    }
  }
}

// Export a singleton instance
export const keybindings = new KeybindingRegistry();
