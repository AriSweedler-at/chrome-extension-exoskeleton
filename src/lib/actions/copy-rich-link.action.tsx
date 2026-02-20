import {Action} from '@exo/lib/actions/base-action';

export interface CopyRichLinkPayload {
    url: string;
    formatIndex?: number; // Specific format to copy (optional)
    formatLabel?: string; // Specific format label to find (e.g., 'Raw URL')
}

export interface CopyRichLinkResult {
    success: boolean;
    formatIndex: number;
    totalFormats: number;
}

export class CopyRichLinkAction extends Action<CopyRichLinkPayload, CopyRichLinkResult> {
    type = 'COPY_RICH_LINK' as const;
}
