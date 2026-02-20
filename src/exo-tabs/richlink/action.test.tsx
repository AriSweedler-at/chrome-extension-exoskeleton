import {describe, it, expect} from 'vitest';
import {CopyRichLinkAction} from '@exo/exo-tabs/richlink/action';

describe('CopyRichLinkAction', () => {
    it('should have correct type', () => {
        const action = new CopyRichLinkAction();
        expect(action.type).toBe('COPY_RICH_LINK');
    });
});
