const installAndroidNumberInput = ({
    scratchBlocksObject,
    userAgent = navigator.userAgent
} = {}) => {
    if (!/android/i.test(userAgent)) return () => {};

    const ScratchFieldNumber = scratchBlocksObject.fieldRegistry.getClass('field_number');
    const originalShowEditor = ScratchFieldNumber.prototype.showEditor_;
    const showTextEditor = scratchBlocksObject.FieldTextInput.prototype.showEditor_;
    /* eslint-disable @typescript-eslint/no-invalid-this */
    const showAndroidNumberEditor = function (event) {
        const hadOwnWidgetCreate = Object.prototype.hasOwnProperty.call(this, 'widgetCreate_');
        const originalWidgetCreate = this.widgetCreate_;
        this.widgetCreate_ = function () {
            const input = originalWidgetCreate.call(this);
            input.setAttribute('inputmode', 'decimal');
            return input;
        };
        try {
            return showTextEditor.call(this, event, false);
        } finally {
            if (hadOwnWidgetCreate) {
                this.widgetCreate_ = originalWidgetCreate;
            } else {
                delete this.widgetCreate_;
            }
        }
    };
    /* eslint-enable @typescript-eslint/no-invalid-this */

    ScratchFieldNumber.prototype.showEditor_ = showAndroidNumberEditor;
    return () => {
        if (ScratchFieldNumber.prototype.showEditor_ === showAndroidNumberEditor) {
            ScratchFieldNumber.prototype.showEditor_ = originalShowEditor;
        }
    };
};

export default installAndroidNumberInput;
