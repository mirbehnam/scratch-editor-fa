import libraryItemMatchesQuery from '../../../src/lib/libraries/library-item-search.js';

describe('libraryItemMatchesQuery', () => {
    const cat = {
        name: 'Cat',
        tags: ['animals', 'pet']
    };

    test('matches the localized Persian name', () => {
        expect(libraryItemMatchesQuery(cat, 'گربه', 'گربه')).toBe(true);
    });

    test('matches the original English name while displaying Persian', () => {
        expect(libraryItemMatchesQuery(cat, 'cat', 'گربه')).toBe(true);
    });

    test('normalizes Arabic and Persian characters', () => {
        expect(libraryItemMatchesQuery({name: 'Kiran'}, 'كايرن', 'کایرن')).toBe(true);
    });

    test('still searches tags', () => {
        expect(libraryItemMatchesQuery(cat, 'pet', 'گربه')).toBe(true);
    });

    test('does not match unrelated text', () => {
        expect(libraryItemMatchesQuery(cat, 'سگ', 'گربه')).toBe(false);
    });
});
