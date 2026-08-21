import fs from 'fs';
import path from 'path';

describe('touch menu styles', () => {
    test('keeps nested menus inside the parent menu on touch devices', () => {
        const styles = fs.readFileSync(
            path.resolve(__dirname, '../../../src/components/menu/menu.css'),
            'utf8'
        );

        const touchMedia = styles.match(/@media\s*\(hover:\s*none\)[^{]*\{[\s\S]*\}\s*$/);
        expect(touchMedia).not.toBeNull();
        expect(touchMedia[0]).toMatch(
            /\.submenu\.left,\s*\.submenu\.right\s*\{[^}]*left:\s*0;[^}]*right:\s*auto;/s
        );
    });
});
