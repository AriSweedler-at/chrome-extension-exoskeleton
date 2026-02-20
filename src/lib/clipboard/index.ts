export class Clipboard {
    /**
     * Write text and optionally HTML to the clipboard
     */
    static async write(text: string, html?: string): Promise<void> {
        // Try modern Clipboard API first
        try {
            if (html) {
                const blob = new Blob([html], {type: 'text/html'});
                const textBlob = new Blob([text], {type: 'text/plain'});
                const item = new ClipboardItem({
                    'text/html': blob,
                    'text/plain': textBlob,
                });
                await navigator.clipboard.write([item]);
            } else {
                await navigator.clipboard.writeText(text);
            }
        } catch (error) {
            // Fallback to execCommand method when document is not focused
            console.log('Clipboard API failed, using fallback method:', error);
            this.fallbackCopy(text, html);
        }
    }

    /**
     * Fallback clipboard copy using execCommand (works without focus)
     */
    private static fallbackCopy(text: string, html?: string): void {
        const listener = (e: ClipboardEvent) => {
            e.preventDefault();
            e.clipboardData?.setData('text/plain', text);
            if (html) {
                e.clipboardData?.setData('text/html', html);
            }
        };

        document.addEventListener('copy', listener);
        document.execCommand('copy');
        document.removeEventListener('copy', listener);
    }
}
