const DATABASE = 'ScratchFarsi-PackagerSnapshot';

const open = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('snapshot');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
});

const write = async (value, key, remove = false, signal) => {
    const database = await open();
    try {
        if (signal && signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        await new Promise((resolve, reject) => {
            const transaction = database.transaction('snapshot', 'readwrite');
            const store = transaction.objectStore('snapshot');
            if (remove) store.delete(key);
            else {
                store.clear();
                store.put(value, key);
            }
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error('Snapshot transaction aborted'));
        });
    } finally {
        database.close();
    }
};

export const createPackagerSnapshot = async (vm, title, key, signal) => {
    const buffer = await (await vm.saveProjectSb3()).arrayBuffer();
    const name = `${title || 'Project'}.sb3`;
    await write({name, blob: new Blob([buffer], {type: 'application/x.scratch.sb3'})}, key, false, signal);
    return {buffer, name};
};

export const clearPackagerSnapshot = key => write(null, key, true);
