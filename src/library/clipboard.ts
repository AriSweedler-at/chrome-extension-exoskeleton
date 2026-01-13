export class Clipboard {
    /**
     * Write text and optionally HTML to the clipboard
     */
    static async write(text: string, html?: string): Promise<void> {
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
    }
}
