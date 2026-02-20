import {Handler} from '@exo/lib/richlink/base';

export class SpinnakerHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('spinnaker');
    }

    getLabel(): string {
        return 'Spinnaker Pipeline';
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
        return 50;
    }

    private extractTitle(): string {
        // Try to extract pipeline name from execution group
        // TODO: Verify these selectors work across different Spinnaker deployments
        const pipelineName = document.querySelector('.execution-group-title');
        if (pipelineName?.textContent) {
            return pipelineName.textContent.trim();
        }

        // Try to extract execution name
        const executionName = document.querySelector('.execution-name');
        if (executionName?.textContent) {
            return executionName.textContent.trim();
        }

        // Try to extract pipeline config name
        const configName = document.querySelector('.pipeline-config-name');
        if (configName?.textContent) {
            return configName.textContent.trim();
        }

        // Try to extract application name
        const appName = document.querySelector('.application-header');
        if (appName?.textContent) {
            return appName.textContent.trim();
        }

        return 'Spinnaker Page';
    }
}
