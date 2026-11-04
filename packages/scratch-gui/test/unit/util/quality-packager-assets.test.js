import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root = path.resolve(__dirname, '../../../../..');
const directory = path.join(root, 'vendor/quality-packager');
const hashes = JSON.parse(fs.readFileSync(path.join(directory, 'runtime-hashes.json'), 'utf8'));
describe('pinned offline quality packager', () => {
    test('generated files match their recorded SHA256 and contain no source maps', () => {
        expect(Object.keys(hashes)).toContain('index.html');
        expect(Object.keys(hashes)).toContain('scaffolding/scaffolding-min.js');
        for (const [name, expected] of Object.entries(hashes)) {
            expect(name.endsWith('.map')).toBe(false);
            const data = fs.readFileSync(path.join(directory, 'runtime', name));
            expect(createHash('sha256').update(data)
                .digest('hex')).toBe(expected);
        }
    });
});
