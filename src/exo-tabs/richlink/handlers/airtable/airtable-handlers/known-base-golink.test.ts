import {describe, it, expect, afterEach} from 'vitest';
import {golinkConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/known-base-golink';
import {createSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/handler-factory';

const golinkHandler = createSubHandler(golinkConfig);

/** Page-header text cell that holds the go-link slug. */
function addHeaderSlugCell(slug: string) {
    const pair = document.createElement('div');
    pair.id = 'pageCellLabelPair';

    const cell = document.createElement('div');
    cell.setAttribute('data-testid', 'cell-editor');
    cell.setAttribute('data-columntype', 'text');
    cell.textContent = slug;
    pair.appendChild(cell);

    document.body.appendChild(pair);
}

/** An unrelated text cell elsewhere on the page (e.g. the destination URL field). */
function addStrayTextCell(text: string) {
    const cell = document.createElement('div');
    cell.setAttribute('data-testid', 'cell-editor');
    cell.setAttribute('data-columntype', 'text');
    cell.textContent = text;
    document.body.appendChild(cell);
}

describe('golinkHandler', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('handles Golink base URLs', () => {
        expect(
            golinkHandler.canHandle(
                new URL('https://airtable.com/appVDgfLKNQo9z5b2/recbY3lLsoGV68bwR'),
            ),
        ).toBe(true);
    });

    it('does not handle other Airtable base URLs', () => {
        expect(golinkHandler.canHandle(new URL('https://airtable.com/appOTHER/recXYZ'))).toBe(
            false,
        );
    });

    it('rewrites title and URL to go/<slug>', () => {
        addHeaderSlugCell('terraform-local');

        const formats = golinkHandler.getFormats({
            url: 'https://airtable.com/appVDgfLKNQo9z5b2/recbY3lLsoGV68bwR',
        });
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Golink');
        expect(formats[0].html).toBe('<a href="https://go/terraform-local">go/terraform-local</a>');
        expect(formats[0].text).toBe('go/terraform-local (https://go/terraform-local)');
    });

    it('ignores stray text cells outside the page header', () => {
        // The destination URL field also renders as data-columntype="text" — make
        // sure we don't pick that up instead of the header slug.
        addStrayTextCell('https://app.datadoghq.com/dashboard/some-dashboard');
        addHeaderSlugCell('terraform-local');

        const formats = golinkHandler.getFormats({
            url: 'https://airtable.com/appVDgfLKNQo9z5b2/recbY3lLsoGV68bwR',
        });
        expect(formats[0].html).toBe('<a href="https://go/terraform-local">go/terraform-local</a>');
    });

    it('falls back to original URL and Golink label when slug is missing', () => {
        const formats = golinkHandler.getFormats({
            url: 'https://airtable.com/appVDgfLKNQo9z5b2/recbY3lLsoGV68bwR',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appVDgfLKNQo9z5b2/recbY3lLsoGV68bwR">Golink</a>',
        );
    });
});
