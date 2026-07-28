import {
    Handler,
    linkFormat,
    type FormatContext,
    type LinkFormat,
} from '@exo/exo-tabs/richlink/base';
import {
    isExecutionsView,
    getIsolatedPipeline,
    getApplicationName,
} from '@exo/exo-tabs/spinnaker/filters';

const DEPLOY_GROUP_PATTERN =
    /^Deploy Pipeline Group\s+(.+?)\s+(ALPHA|STAGING|PRODUCTION)(?:\s+\d+)?$/;
const DEPLOY_PATTERN = /^Deploy\s+(.+?)\s+(ALPHA|STAGING|PRODUCTION)(?:\s+\d+)?$/;
const TRAILING_NUMBER = /\s+\d+$/;

/**
 * Format a raw Spinnaker pipeline title into a structured label + title.
 *
 * Pipeline groups and individual pipelines are intentionally distinct formats:
 * - Pipeline groups: "Deploy Pipeline Group Web PRODUCTION" → "Spinnaker: deploy PRODUCTION: group: Web"
 *   (label: "Spinnaker Pipeline Group") — groups fan out into multiple individual pipelines
 * - Deploy pipelines: "Deploy svc PRODUCTION 1" → "Spinnaker: deploy PRODUCTION: svc"
 *   (label: "Spinnaker Pipeline") — a single pipeline deploying one service
 * - Other pipelines: "Some Pipeline 5" → "Spinnaker Pipeline: Some Pipeline" (number stripped)
 * - Fallback (null): "Spinnaker Page"
 */
export function formatSpinnakerTitle(raw: string | null): {label: string; title: string} {
    if (raw === null) {
        return {label: 'Spinnaker Pipeline', title: 'Spinnaker Page'};
    }

    const groupMatch = raw.match(DEPLOY_GROUP_PATTERN);
    if (groupMatch) {
        const [, group, env] = groupMatch;
        return {
            label: 'Spinnaker Pipeline Group',
            title: `Spinnaker: deploy ${env}: group: ${group}`,
        };
    }

    const deployMatch = raw.match(DEPLOY_PATTERN);
    if (deployMatch) {
        const [, service, env] = deployMatch;
        return {
            label: 'Spinnaker Pipeline',
            title: `Spinnaker: deploy ${env}: ${service}`,
        };
    }

    const stripped = raw.replace(TRAILING_NUMBER, '');
    return {label: 'Spinnaker Pipeline', title: `Spinnaker Pipeline: ${stripped}`};
}

export class SpinnakerHandler extends Handler {
    readonly label = 'Spinnaker Pipeline';
    readonly priority = 50;

    canHandle(url: URL): boolean {
        return (
            url.hostname === 'spinnaker.k8s.shadowbox.cloud' ||
            url.hostname === 'spinnaker.k8s.staging-shadowbox.cloud' ||
            url.hostname === 'spinnaker.k8s.alpha-shadowbox.cloud'
        );
    }

    private extractRawTitle(): string | null {
        const selectors = [
            '.execution-group-title',
            '.execution-name',
            '.pipeline-config-name',
            '.application-header',
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el?.textContent) {
                return el.textContent.trim();
            }
        }
        return null;
    }

    extractLinkText(): string {
        return formatSpinnakerTitle(this.extractRawTitle()).title;
    }

    /**
     * On executions views the page lists many pipelines, so a pipeline link
     * is only offered in isolation mode (exactly one pipeline filter, what
     * the spinnaker tab's 'i' keybinding produces) — and then the pipeline
     * name comes from the URL filter itself, no DOM guessing. Without
     * isolation the handler offers only an application link, so copying
     * still works and falls through to the page-title/raw-url fallbacks.
     * Non-executions Spinnaker pages keep the DOM-extracted titles.
     */
    override getFormats(ctx: FormatContext): LinkFormat[] {
        if (isExecutionsView(ctx.url)) {
            const formats: LinkFormat[] = [];

            const isolated = getIsolatedPipeline(ctx.url);
            if (isolated) {
                const {label, title} = formatSpinnakerTitle(isolated);
                formats.push(linkFormat(label, this.priority, title, ctx.url));
            }

            const app = getApplicationName(ctx.url);
            if (app) {
                formats.push(
                    linkFormat(
                        'Spinnaker Application',
                        this.priority + 1,
                        `Spinnaker: ${app}`,
                        ctx.url,
                    ),
                );
            }
            return formats;
        }

        const {label, title} = formatSpinnakerTitle(this.extractRawTitle());
        return [linkFormat(label, this.priority, title, ctx.url)];
    }
}
