const {
    APP_NAME,
    WINDOW_TITLE,
    createCloseHandler,
    getCloseDialogOptions
} = require('../../../desktop/window-config.cjs');

describe('Windows desktop configuration', () => {
    test('uses the requested application and window titles', () => {
        expect(APP_NAME).toBe('Scratch farsi');
        expect(WINDOW_TITLE).toBe('Scratch farsi 3.0');
    });

    test.each([
        ['fa', 'آیا می‌خواهید از Scratch farsi خارج شوید؟', ['خروج', 'انصراف']],
        ['ar', 'هل تريد الخروج من Scratch farsi؟', ['خروج', 'إلغاء']],
        ['en', 'Do you want to exit Scratch farsi?', ['Exit', 'Cancel']]
    ])('localizes the close confirmation for %s', (locale, message, buttons) => {
        expect(getCloseDialogOptions(locale)).toMatchObject({
            message,
            buttons,
            defaultId: 1,
            cancelId: 1
        });
    });

    test('uses English close confirmation for an unknown locale', () => {
        expect(getCloseDialogOptions('unknown').message).toBe('Do you want to exit Scratch farsi?');
    });

    test('destroys the window and quits after confirming close', async () => {
        const event = {preventDefault: jest.fn()};
        const mainWindow = {
            destroy: jest.fn(),
            isDestroyed: jest.fn(() => false),
            webContents: {
                executeJavaScript: jest.fn(() => Promise.resolve('fa'))
            }
        };
        const app = {quit: jest.fn()};
        const dialog = {showMessageBox: jest.fn(() => Promise.resolve({response: 0}))};
        const logger = {error: jest.fn()};
        const handler = createCloseHandler({app, dialog, logger, mainWindow});

        await handler(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(dialog.showMessageBox).toHaveBeenCalledWith(
            mainWindow,
            expect.objectContaining({message: 'آیا می‌خواهید از Scratch farsi خارج شوید؟'})
        );
        expect(mainWindow.destroy).toHaveBeenCalled();
        expect(app.quit).toHaveBeenCalled();
    });

    test('keeps the window open after cancelling close', async () => {
        const event = {preventDefault: jest.fn()};
        const mainWindow = {
            destroy: jest.fn(),
            isDestroyed: jest.fn(() => false),
            webContents: {
                executeJavaScript: jest.fn(() => Promise.resolve('en'))
            }
        };
        const app = {quit: jest.fn()};
        const dialog = {showMessageBox: jest.fn(() => Promise.resolve({response: 1}))};
        const logger = {error: jest.fn()};
        const handler = createCloseHandler({app, dialog, logger, mainWindow});

        await handler(event);

        expect(mainWindow.destroy).not.toHaveBeenCalled();
        expect(app.quit).not.toHaveBeenCalled();
    });
});
