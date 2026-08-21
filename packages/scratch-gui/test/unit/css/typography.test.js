import fs from 'fs';
import path from 'path';

describe('Persian typography', () => {
    test('applies BYekan to block category labels', () => {
        const typography = fs.readFileSync(
            path.resolve(__dirname, '../../../src/css/typography.css'),
            'utf8'
        );

        expect(typography).toMatch(
            /:global\(\.blocklyToolboxCategoryLabel\)[^{}]*\{[^{}]*font-family:\s*"BYekan"[^{}]*!important;/s
        );
    });
});
