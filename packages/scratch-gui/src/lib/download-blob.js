export default (filename, blob) => {
    const androidProjectSaver = window.AndroidProjectSaver;
    const isProject = /\.sb3$/i.test(filename);
    const isSprite = /\.sprite3$/i.test(filename);
    const canSaveProject = isProject && androidProjectSaver &&
        typeof androidProjectSaver.beginSave === 'function' &&
        typeof androidProjectSaver.appendChunk === 'function' &&
        typeof androidProjectSaver.finishSave === 'function';
    const canSaveSprite = isSprite && androidProjectSaver &&
        typeof androidProjectSaver.beginSpriteSave === 'function' &&
        typeof androidProjectSaver.appendSpriteChunk === 'function' &&
        typeof androidProjectSaver.finishSpriteSave === 'function';

    if (canSaveProject || canSaveSprite) {
        const reader = new FileReader();
        reader.onloadend = function () {
            const encoded = reader.result.split(',')[1];
            const chunkSize = 262144;

            if (canSaveProject) {
                androidProjectSaver.beginSave(filename);
                for (let offset = 0; offset < encoded.length; offset += chunkSize) {
                    androidProjectSaver.appendChunk(encoded.slice(offset, offset + chunkSize));
                }
                androidProjectSaver.finishSave();
            } else {
                androidProjectSaver.beginSpriteSave(filename, blob.size);
                for (let offset = 0; offset < encoded.length; offset += chunkSize) {
                    androidProjectSaver.appendSpriteChunk(encoded.slice(offset, offset + chunkSize));
                }
                androidProjectSaver.finishSpriteSave();
            }
        };
        reader.readAsDataURL(blob);
        return;
    }

    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);

    // Use special ms version if available to get it working on Edge.
    if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, filename);
        return;
    }

    if ('download' in HTMLAnchorElement.prototype) {
        const url = window.URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.type = blob.type;
        downloadLink.click();
        // remove the link after a timeout to prevent a crash on iOS 13 Safari
        window.setTimeout(() => {
            document.body.removeChild(downloadLink);
            window.URL.revokeObjectURL(url);
        }, 1000);
    } else {
        // iOS 12 Safari, open a new page and set href to data-uri
        let popup = window.open('', '_blank');
        const reader = new FileReader();
        reader.onloadend = function () {
            popup.location.href = reader.result;
            popup = null;
        };
        reader.readAsDataURL(blob);
    }

};
