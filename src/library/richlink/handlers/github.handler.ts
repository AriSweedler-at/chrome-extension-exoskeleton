import {Handler} from '../base';

export class GitHubHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('github.com');
    }

    getLabel(): string {
        return 'GitHub PR';
    }

    async getHtml(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `<a href="${url}">${title}</a>`;
    }

    async getText(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `${title} (${url})`;
    }

    getPriority(): number {
        return 10;
    }

    private extractTitle(): string {
        const titleElement = document.querySelector('.js-issue-title');
        if (titleElement?.textContent) {
            return titleElement.textContent.trim();
        }
        return 'GitHub Page';
    }
}
