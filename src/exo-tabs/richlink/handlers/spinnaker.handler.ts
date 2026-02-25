import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

export class SpinnakerHandler extends Handler {
    readonly label = 'Spinnaker Pipeline';
    readonly priority = 50;

    canHandle(url: string): boolean {
        return (
            url.includes('spinnaker.k8s.shadowbox.cloud') ||
            url.includes('spinnaker.k8s.alpha-shadowbox.cloud')
        );
    }

    extractLinkText(_ctx: FormatContext): string {
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
