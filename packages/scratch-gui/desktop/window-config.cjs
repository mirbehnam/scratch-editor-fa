const APP_NAME = 'Scratch farsi';
const WINDOW_TITLE = 'Scratch farsi 3.0';

const closeDialogMessages = {
    ar: {
        title: `الخروج من ${APP_NAME}`,
        message: `هل تريد الخروج من ${APP_NAME}؟`,
        buttons: ['خروج', 'إلغاء']
    },
    en: {
        title: `Exit ${APP_NAME}`,
        message: `Do you want to exit ${APP_NAME}?`,
        buttons: ['Exit', 'Cancel']
    },
    fa: {
        title: `خروج از ${APP_NAME}`,
        message: `آیا می‌خواهید از ${APP_NAME} خارج شوید؟`,
        buttons: ['خروج', 'انصراف']
    }
};

const getCloseDialogOptions = locale => {
    const language = typeof locale === 'string' ? locale.toLowerCase().split('-')[0] : 'en';
    const messages = closeDialogMessages[language] || closeDialogMessages.en;
    return {
        type: 'question',
        title: messages.title,
        message: messages.message,
        buttons: messages.buttons,
        defaultId: 1,
        cancelId: 1,
        noLink: true
    };
};

const createCloseHandler = ({app, dialog, mainWindow, logger}) => {
    let closeConfirmationOpen = false;
    let forceClose = false;

    return async event => {
        if (forceClose) return;
        event.preventDefault();
        if (closeConfirmationOpen) return;

        closeConfirmationOpen = true;
        try {
            const locale = await mainWindow.webContents.executeJavaScript('document.documentElement.lang', true);
            if (mainWindow.isDestroyed()) return;
            const {response} = await dialog.showMessageBox(mainWindow, getCloseDialogOptions(locale));
            if (response === 0) {
                forceClose = true;
                mainWindow.destroy();
                app.quit();
            }
        } catch (error) {
            logger.error('Failed to confirm closing the Scratch farsi window:', error);
        } finally {
            closeConfirmationOpen = false;
        }
    };
};

module.exports = {
    APP_NAME,
    WINDOW_TITLE,
    createCloseHandler,
    getCloseDialogOptions
};
