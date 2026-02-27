import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class SpinnakerHandler extends Handler {
    canHandle(url: URL): boolean {
        return (
            url.hostname === 'spinnaker.k8s.shadowbox.cloud' ||
            url.hostname === 'spinnaker.k8s.alpha-shadowbox.cloud'
        );
    }

    private extractLinkText(): string {
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

    getFormats(ctx: FormatContext): LinkFormat[] {
        const title = this.extractLinkText();
        return [
            {
                label: 'Spinnaker Pipeline',
                priority: 50,
                html: `<a href="${ctx.url}">${title}</a>`,
                text: `${title} (${ctx.url})`,
            },
        ];
    }
}
