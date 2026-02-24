import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

export class SpaceliftHandler extends Handler {
    readonly label = 'Spacelift Stack';
    readonly priority = 60;

    canHandle(url: string): boolean {
        return url.includes('spacelift.shadowbox.cloud');
    }

    extractLinkText(_ctx: FormatContext): string {
        // Try to extract stack name
        // TODO: Verify these selectors work across different Spacelift UI versions
        const stackName = document.querySelector('.stack-name');
        if (stackName?.textContent) {
            return stackName.textContent.trim();
        }

        // Try to extract run title
        const runTitle = document.querySelector('.run-title');
        if (runTitle?.textContent) {
            return runTitle.textContent.trim();
        }

        // Try to extract module name
        const moduleName = document.querySelector('[data-testid="module-name"]');
        if (moduleName?.textContent) {
            return moduleName.textContent.trim();
        }

        // Try to extract policy name
        const policyName = document.querySelector('.policy-header');
        if (policyName?.textContent) {
            return policyName.textContent.trim();
        }

        // Fallback to any h1 on the page
        const h1 = document.querySelector('h1');
        if (h1?.textContent) {
            return h1.textContent.trim();
        }

        return 'Spacelift Stack';
    }
}
