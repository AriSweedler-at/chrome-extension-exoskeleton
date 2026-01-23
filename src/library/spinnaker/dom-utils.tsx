export interface StageInfo {
    stage: number;
    step: number;
    details: string;
}

/**
 * Extract execution ID from Spinnaker URL
 * Pattern: /executions/01HPN64GE091GK831P0XG2JQQT
 */
export function getExecutionIdFromUrl(url: string = window.location.href): string | null {
    const match = url.match(/\/executions\/([A-Z0-9]+)/);
    return match ? match[1] : null;
}

/**
 * Check if execution details are open (has stage params)
 */
export function isExecutionOpen(url: string = window.location.href): boolean {
    return url.includes('stage=') && url.includes('details=');
}

/**
 * Parse stage information from URL query params
 */
export function getActiveStageFromUrl(url: string = window.location.href): StageInfo | null {
    try {
        const urlObj = new URL(url);
        const queryString = urlObj.search || urlObj.hash.split('?')[1] || '';
        const params = new URLSearchParams(queryString);

        const stage = params.get('stage');
        const step = params.get('step');
        const details = params.get('details');

        if (stage && step && details) {
            const stageNum = parseInt(stage, 10);
            const stepNum = parseInt(step, 10);

            if (isNaN(stageNum) || isNaN(stepNum)) {
                return null;
            }

            return {
                stage: stageNum,
                step: stepNum,
                details,
            };
        }

        return null;
    } catch {
        return null;
    }
}
