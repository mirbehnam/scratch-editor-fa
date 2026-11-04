import log from './log';

let sequence = 0;
const pending = new Map();
let nativeBridge;

const request = message => {
    if (window.desktopPackager) return window.desktopPackager.request(message);
    const bridge = window.AndroidPackagedExport;
    if (!bridge || typeof bridge.postMessage !== 'function') {
        return Promise.reject(new Error('Native export unavailable'));
    }
    if (bridge !== nativeBridge) {
        nativeBridge = bridge;
        bridge.onmessage = event => {
            const result = JSON.parse(event.data);
            const operation = pending.get(result.id);
            if (!operation) return;
            pending.delete(result.id);
            if (result.ok) operation.resolve(result);
            else operation.reject(new Error(result.error || 'Export failed'));
        };
    }
    const id = `export-${++sequence}`;
    return new Promise((resolve, reject) => {
        pending.set(id, {resolve, reject});
        try {
            bridge.postMessage(JSON.stringify({...message, id}));
        } catch (error) {
            pending.delete(id);
            reject(error);
        }
    });
};

export const sanitizeExportName = (name, extension = 'html') => {
    // File names cross the native filesystem boundary.
    // eslint-disable-next-line no-control-regex
    let stem = String(name || 'Project').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
        .replace(/[. ]+$/, '')
        .replace(/\.(html|json)$/i, '');
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem)) stem = `_${stem}`;
    return `${stem || 'Project'}.${extension}`;
};

const base64 = async blob => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) {
        binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 8192));
    }
    return btoa(binary);
};

export const hasNativePackagerExport = () => Boolean(window.desktopPackager || window.AndroidPackagedExport);

export const exportPackagedFile = async (blob, name, action, locale, configuration = {}) => {
    const {signal, ...nativeConfiguration} = configuration;
    if (signal) signal.throwIfAborted();
    const extension = blob.type === 'application/json' ? 'json' : 'html';
    const filename = sanitizeExportName(name, extension);
    if (!hasNativePackagerExport()) {
        if (window.AndroidProjectSaver) throw new Error('Update the Android client to enable packaged exports');
        const file = new File([blob], filename, {type: blob.type || 'text/html'});
        if (action === 'share') {
            if (!navigator.canShare || !navigator.canShare({files: [file]})) throw new Error('Sharing unavailable');
            await navigator.share({files: [file], title: filename});
        } else {
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        return {name: filename, downloadStarted: action === 'save'};
    }
    const {transfer} = await request({op: 'begin', name: filename, bytes: blob.size, mime: blob.type || 'text/html'});
    try {
        for (let offset = 0; offset < blob.size; offset += 196608) {
            if (signal) signal.throwIfAborted();
            await request({op: 'append', transfer, data: await base64(blob.slice(offset, offset + 196608))});
        }
        if (signal) signal.throwIfAborted();
        return await request({...nativeConfiguration, op: action, transfer, locale});
    } catch (error) {
        await request({op: 'cancel', transfer}).catch(cancelError => {
            log.warn('Packager export cancel failed:', transfer, cancelError);
        });
        throw error;
    }
};

export const isPackagerMessage = (event, frame, origin) => Boolean(
    frame && event.source === frame.contentWindow && event.origin === origin &&
    event.data && event.data.p4 && typeof event.data.p4.type === 'string'
);
