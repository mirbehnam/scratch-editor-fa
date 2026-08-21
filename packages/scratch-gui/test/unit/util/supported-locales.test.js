import locales, {editorMessages, isRtl} from '../../../src/lib/supported-locales';

describe('supported locales', () => {
    test('contains only Arabic, English and Persian', () => {
        expect(Object.keys(locales)).toEqual(['ar', 'en', 'fa']);
        expect(Object.keys(editorMessages)).toEqual(['ar', 'en', 'fa']);
    });

    for (const locale of ['ar', 'en', 'fa']) {
        test(`includes interface, extension and paint messages for ${locale}`, () => {
            expect(editorMessages[locale]['gui.controls.go']).toBeDefined();
            expect(editorMessages[locale]['pen.categoryName']).toBeDefined();
            expect(editorMessages[locale]['paint.selectMode.select']).toBeDefined();
        });
    }

    test('marks only the supported right-to-left languages as RTL', () => {
        expect(isRtl('ar')).toBe(true);
        expect(isRtl('fa')).toBe(true);
        expect(isRtl('en')).toBe(false);
        expect(isRtl('es')).toBe(false);
    });

    test('translates loading a project from the device', () => {
        expect(editorMessages.fa['gui.sharedMessages.loadFromComputerTitle']).toBe('بارگذاری از رایانه');
        expect(editorMessages.ar['gui.sharedMessages.loadFromComputerTitle']).toBe('تحميل من جهاز الكمبيوتر');
    });
});
