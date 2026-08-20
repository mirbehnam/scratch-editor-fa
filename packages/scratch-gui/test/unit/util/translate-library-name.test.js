import backdrops from '../../../src/lib/libraries/backdrops.json';
import sounds from '../../../src/lib/libraries/sounds.json';
import sprites from '../../../src/lib/libraries/sprites.json';
import translateLibraryName from '../../../src/lib/libraries/translate-library-name.js';

describe('translateLibraryName', () => {
    const libraries = {backdrops, sounds, sprites};

    test.each([
        ['sprites', 'Cat', 'گربه'],
        ['sprites', 'Kiran', 'کایرن'],
        ['backdrops', 'Arctic', 'قطب شمال'],
        ['sounds', 'Meow', 'میو']
    ])('translates %s name %s to Persian', (library, name, expected) => {
        expect(translateLibraryName(library, name, 'fa')).toBe(expected);
    });

    test.each(Object.entries(libraries))('provides a Persian name for every built-in %s item', (library, items) => {
        items.forEach(item => {
            const translatedName = translateLibraryName(library, item.name, 'fa');
            expect(translatedName).toMatch(/[\u0600-\u06FF]/);
            expect(translatedName).not.toMatch(/[A-Za-z]/);
        });
    });

    test('keeps names unchanged outside Persian', () => {
        expect(translateLibraryName('sprites', 'Cat', 'en')).toBe('Cat');
    });

    test('does not translate custom assets', () => {
        expect(translateLibraryName('sprites', 'My Custom Cat', 'fa')).toBe('My Custom Cat');
    });
});
