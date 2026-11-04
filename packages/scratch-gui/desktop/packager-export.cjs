const fs = require('node:fs/promises');
const {constants} = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');

const createPackagerExporter = ({downloads, cache, shareFile}) => {
    const sessions = new Map();
    let queue = Promise.resolve();
    const prune = async () => {
        await fs.mkdir(cache, {recursive: true});
        for (const entry of await fs.readdir(cache, {withFileTypes: true})) {
            if (!entry.isDirectory() || !/^[0-9a-f-]{36}$/.test(entry.name)) continue;
            const directory = path.join(cache, entry.name);
            const stat = await fs.stat(directory);
            if (Date.now() - stat.mtimeMs > 86400000) await remove({directory});
        }
    };
    const remove = async session => {
        if (session.handle) await session.handle.close();
        const target = path.resolve(session.directory);
        if (path.dirname(target) !== path.resolve(cache)) throw new Error('Invalid export cache directory');
        await fs.rm(target, {recursive: true, force: true});
    };
    const operate = async message => {
        if (message.op === 'begin') {
            const {name, mime, bytes} = message;
            if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > 1073741824) throw new Error('Invalid export size');
            const extension = mime === 'application/json' ? '.json' : mime === 'text/html' ? '.html' : '';
            if (!extension || typeof name !== 'string' || path.basename(name) !== name ||
                !name.endsWith(extension) || /[<>:"/\\|?*\u0000-\u001f]/.test(name)) throw new Error('Invalid export name');
            for (const [id, previous] of sessions) {
                await remove(previous);
                sessions.delete(id);
            }
            await prune();
            const transfer = randomUUID();
            const directory = path.join(cache, transfer);
            await fs.mkdir(directory, {recursive: true});
            const filename = path.join(directory, name);
            const handle = await fs.open(filename, 'wx');
            sessions.set(transfer, {directory, filename, name, handle, bytes, received: 0});
            return {transfer};
        }
        const session = sessions.get(message.transfer);
        if (!session) throw new Error('Export transfer not found');
        if (message.op === 'cancel') {
            await remove(session);
            sessions.delete(message.transfer);
            return {};
        }
        if (message.op === 'append') {
            if (typeof message.data !== 'string' || message.data.length > 262144 || !session.handle) {
                throw new Error('Invalid export chunk');
            }
            const bytes = Buffer.from(message.data, 'base64');
            if (bytes.toString('base64') !== message.data || session.received + bytes.length > session.bytes) {
                throw new Error('Export chunk does not match expected data');
            }
            await session.handle.writeFile(bytes);
            session.received += bytes.length;
            return {};
        }
        if (message.op !== 'save' && message.op !== 'share') throw new Error('Unknown export operation');
        if (session.received !== session.bytes) throw new Error('Incomplete export transfer');
        if (session.handle) {
            await session.handle.close();
            session.handle = null;
        }
        if (message.op === 'share') {
            await shareFile(session.filename, session.name);
            // Keep the file available to the selected sharing application.
            sessions.delete(message.transfer);
            return {name: session.name};
        }
        await fs.mkdir(downloads, {recursive: true});
        const extension = path.extname(session.name);
        const stem = path.basename(session.name, extension);
        for (let index = 0; index < 10000; index++) {
            const name = index ? `${stem} (${index})${extension}` : session.name;
            try {
                await fs.copyFile(session.filename, path.join(downloads, name), constants.COPYFILE_EXCL);
                sessions.delete(message.transfer);
                await remove(session).catch(error => console.warn('Packager cache cleanup failed:', session.name, error));
                return {name};
            } catch (error) {
                if (error.code !== 'EEXIST') throw error;
            }
        }
        throw new Error('Too many files with this name in Downloads');
    };
    return {
        request: message => {
            const operation = queue.then(() => operate(message));
            queue = operation.catch(() => {});
            return operation;
        },
        dispose: async () => {
            await queue;
            for (const session of sessions.values()) await remove(session);
            sessions.clear();
        }
    };
};
module.exports = {createPackagerExporter};
