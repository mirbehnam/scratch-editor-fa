import installAndroidNumberInput from '../../../src/lib/android-number-input';

const createScratchBlocks = () => {
    const input = document.createElement('input');
    const showTextEditor = jest.fn();
    const showScratchNumberEditor = jest.fn();
    const ScratchFieldNumber = function () {};
    ScratchFieldNumber.prototype.showEditor_ = showScratchNumberEditor;
    ScratchFieldNumber.prototype.widgetCreate_ = jest.fn(() => input);
    const scratchBlocksObject = {
        FieldTextInput: {prototype: {showEditor_: showTextEditor}},
        fieldRegistry: {getClass: jest.fn(() => ScratchFieldNumber)}
    };

    return {
        input,
        scratchBlocksObject,
        ScratchFieldNumber,
        showScratchNumberEditor,
        showTextEditor
    };
};

describe('installAndroidNumberInput', () => {
    test.each(['touch', 'mouse', null])(
        'uses the Android keyboard instead of the Scratch number pad for a %s pointer',
        pointerType => {
            const {
                input,
                scratchBlocksObject,
                ScratchFieldNumber,
                showScratchNumberEditor,
                showTextEditor
            } = createScratchBlocks();
            const cleanup = installAndroidNumberInput({
                scratchBlocksObject,
                userAgent: 'Mozilla/5.0 (Linux; Android 15)'
            });
            const numberField = new ScratchFieldNumber();
            showTextEditor.mockImplementation(() => {
                numberField.htmlInput_ = numberField.widgetCreate_();
            });
            const event = pointerType ? {pointerType} : {};

            numberField.showEditor_(event);

            expect(showScratchNumberEditor).not.toHaveBeenCalled();
            expect(showTextEditor).toHaveBeenCalledWith(event, false);
            expect(input.getAttribute('inputmode')).toBe('decimal');

            cleanup();
            expect(ScratchFieldNumber.prototype.showEditor_).toBe(showScratchNumberEditor);
        }
    );

    test('does not change number fields outside Android', () => {
        const {
            scratchBlocksObject,
            ScratchFieldNumber,
            showScratchNumberEditor,
            showTextEditor
        } = createScratchBlocks();
        const cleanup = installAndroidNumberInput({
            scratchBlocksObject,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0)'
        });
        const numberField = new ScratchFieldNumber();
        const event = {pointerType: 'touch'};

        numberField.showEditor_(event);

        expect(showScratchNumberEditor).toHaveBeenCalledWith(event);
        expect(showTextEditor).not.toHaveBeenCalled();

        cleanup();
    });
});
