export interface LinkFormat {
    label: string; // Display name: "GitHub PR", "Page Title", "Raw URL"
    html: string; // HTML to copy: "<a href='...'>text</a>"
    text: string; // Plain text: "text (url)"
}

export abstract class Handler {
    abstract canHandle(url: string): boolean;
    abstract getLabel(): string;
    abstract getHtml(): Promise<string>;
    abstract getText(): Promise<string>;
    abstract getPriority(): number; // Lower = appears first

    async getFormat(): Promise<LinkFormat> {
        return {
            label: this.getLabel(),
            html: await this.getHtml(),
            text: await this.getText(),
        };
    }

    isFallback(): boolean {
        return false;
    }
}
