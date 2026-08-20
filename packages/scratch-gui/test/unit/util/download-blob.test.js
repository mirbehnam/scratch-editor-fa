import downloadBlob from '../../../src/lib/download-blob';

describe('downloadBlob Android bridge', () => {
    const NativeFileReader = global.FileReader;
    const nativeCreateObjectURL = window.URL.createObjectURL;

    afterEach(() => {
        global.FileReader = NativeFileReader;
        window.URL.createObjectURL = nativeCreateObjectURL;
        delete window.AndroidProjectSaver;
        document.body.innerHTML = '';
        jest.restoreAllMocks();
    });

    test('sends sb3 data to Android in chunks', () => {
        const encoded = 'a'.repeat(262145);
        const androidProjectSaver = {
            beginSave: jest.fn(),
            appendChunk: jest.fn(),
            finishSave: jest.fn()
        };
        window.AndroidProjectSaver = androidProjectSaver;
        global.FileReader = class MockFileReader {
            readAsDataURL () {
                this.result = `data:application/x.scratch.sb3;base64,${encoded}`;
                this.onloadend();
            }
        };

        downloadBlob('project.sb3', new Blob(['project']));

        expect(androidProjectSaver.beginSave).toHaveBeenCalledWith('project.sb3');
        expect(androidProjectSaver.appendChunk).toHaveBeenCalledTimes(2);
        expect(androidProjectSaver.appendChunk.mock.calls[0][0]).toHaveLength(262144);
        expect(androidProjectSaver.appendChunk.mock.calls[1][0]).toBe('a');
        expect(androidProjectSaver.finishSave).toHaveBeenCalledTimes(1);
        expect(document.querySelector('a')).toBeNull();
    });

    test('sends sprite3 data through the sprite bridge', () => {
        const androidProjectSaver = {
            beginSpriteSave: jest.fn(),
            appendSpriteChunk: jest.fn(),
            finishSpriteSave: jest.fn()
        };
        window.AndroidProjectSaver = androidProjectSaver;
        global.FileReader = class MockFileReader {
            readAsDataURL () {
                this.result = 'data:application/zip;base64,c3ByaXRl';
                this.onloadend();
            }
        };
        const blob = new Blob(['sprite']);

        downloadBlob('sprite.sprite3', blob);

        expect(androidProjectSaver.beginSpriteSave).toHaveBeenCalledWith('sprite.sprite3', blob.size);
        expect(androidProjectSaver.appendSpriteChunk).toHaveBeenCalledWith('c3ByaXRl');
        expect(androidProjectSaver.finishSpriteSave).toHaveBeenCalledTimes(1);
    });

    test('keeps browser downloads when the Android bridge is incomplete', () => {
        window.AndroidProjectSaver = {};
        const click = jest.fn();
        const originalCreateElement = document.createElement.bind(document);
        jest.spyOn(document, 'createElement').mockImplementation(tagName => {
            const element = originalCreateElement(tagName);
            if (tagName === 'a') element.click = click;
            return element;
        });
        window.URL.createObjectURL = jest.fn(() => 'blob:test');

        downloadBlob('project.sb3', new Blob(['project']));

        expect(click).toHaveBeenCalledTimes(1);
    });
});
