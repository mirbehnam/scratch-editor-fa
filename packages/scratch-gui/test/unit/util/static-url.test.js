import getStaticURL from '../../../src/lib/static-url';

describe('getStaticURL', () => {
    test('resolves static files from the document instead of the executing script', () => {
        expect(getStaticURL('assets/example.svg', 'http://localhost/editor/')).toBe(
            'http://localhost/editor/static/assets/example.svg'
        );
    });

    test('returns a relative URL when a document is not available', () => {
        expect(getStaticURL('assets/example.svg', null)).toBe('static/assets/example.svg');
    });
});
