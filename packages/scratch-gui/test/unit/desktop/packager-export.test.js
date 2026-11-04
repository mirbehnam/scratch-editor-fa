import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const {createPackagerExporter} = require('../../../desktop/packager-export.cjs');

test('Windows packaged exports save exact bytes without overwriting and reject incomplete transfers', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'scratch-packager-test-'));
    const downloads = path.join(root, 'downloads');
    const exporter = createPackagerExporter({downloads, cache: path.join(root, 'cache'), shareFile: jest.fn()});
    try {
        for (const name of ['Project.html', 'Project (1).html']) {
            const text = '<html>فارسی</html>';
            const bytes = Buffer.from(text);
            const {transfer} = await exporter.request({op: 'begin', name: 'Project.html', mime: 'text/html', bytes: bytes.length});
            await exporter.request({op: 'append', transfer, data: bytes.toString('base64')});
            expect((await exporter.request({op: 'save', transfer})).name).toBe(name);
            expect(await fs.readFile(path.join(downloads, name), 'utf8')).toBe(text);
        }
        const {transfer} = await exporter.request({op: 'begin', name: 'incomplete.html', mime: 'text/html', bytes: 10});
        await expect(exporter.request({op: 'save', transfer})).rejects.toThrow('Incomplete');
    } finally {
        await exporter.dispose(); await fs.rm(root, {recursive: true, force: true});
    }
});
