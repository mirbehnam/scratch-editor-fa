const {spawn} = require('node:child_process');
const path = require('node:path');
const children = new Set();

const shareFile = (filename, title) => new Promise((resolve, reject) => {
    if (process.platform !== 'win32') return reject(new Error('Windows sharing is unavailable'));
    const executable = path.join(process.env.SystemRoot || 'C:\\Windows',
        'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const child = spawn(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-STA', '-WindowStyle', 'Hidden',
        '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'share-file.ps1'), '-FilePath', filename,
        '-Title', title], {windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
    children.add(child);
    let opened = false;
    let output = '';
    let errors = '';
    const startup = setTimeout(() => {
        if (!opened) {
            child.kill();
            reject(new Error('Windows sharing did not open'));
        }
    }, 30000);
    child.stdout.on('data', data => {
        output += data.toString();
        if (!opened && output.includes('SHARE_READY')) {
            opened = true;
            clearTimeout(startup);
            resolve();
        }
    });
    child.stderr.on('data', data => { errors += data.toString(); });
    child.once('error', error => { clearTimeout(startup); reject(error); });
    child.once('exit', code => {
        children.delete(child);
        clearTimeout(startup);
        if (!opened) reject(new Error(`Windows sharing failed (${code}): ${errors || output}`));
    });
});
module.exports = {shareFile, stopShareHelpers: () => {
    for (const child of children) child.kill();
    children.clear();
}};
