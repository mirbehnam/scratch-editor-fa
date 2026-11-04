import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {cpSync, readdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root = path.dirname(fileURLToPath(import.meta.url));
const toolchain = path.join(root, 'toolchain');
const result = spawnSync(process.execPath, [path.join(toolchain, 'node_modules/webpack-cli/bin/cli.js'),
    '--config', 'webpack.config.js', '--bail'], {
    cwd: path.join(toolchain, 'vendor/packager'), stdio: 'inherit',
    env: {...process.env, NODE_ENV: 'production', STANDALONE: '1', ENABLE_SERVICE_WORKER: ''}
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
rmSync(path.join(root, 'runtime'), {recursive: true, force: true});
cpSync(path.join(toolchain, 'build/packager'), path.join(root, 'runtime'), {recursive: true});
const hashes = {};
function scan(directory, prefix = '') {
    for (const entry of readdirSync(directory, {withFileTypes: true})) {
        const name = prefix + entry.name;
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) scan(file, name + '/');
        else hashes[name] = createHash('sha256').update(readFileSync(file)).digest('hex');
    }
}
scan(path.join(root, 'runtime'));
writeFileSync(path.join(root, 'runtime-hashes.json'), JSON.stringify(hashes, null, 2) + '\n');
