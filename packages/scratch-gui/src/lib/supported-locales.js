import arExtensions from 'scratch-l10n/editor/extensions/ar.json';
import enExtensions from 'scratch-l10n/editor/extensions/en.json';
import faExtensions from 'scratch-l10n/editor/extensions/fa.json';
import arInterface from 'scratch-l10n/editor/interface/ar.json';
import enInterface from 'scratch-l10n/editor/interface/en.json';
import faInterface from 'scratch-l10n/editor/interface/fa.json';
import arPaintEditor from 'scratch-l10n/editor/paint-editor/ar.json';
import enPaintEditor from 'scratch-l10n/editor/paint-editor/en.json';
import faPaintEditor from 'scratch-l10n/editor/paint-editor/fa.json';

const locales = {
    ar: {name: 'العربية'},
    en: {name: 'English'},
    fa: {name: 'فارسی'}
};

const mergeEditorMessages = (interfaceMessages, extensionMessages, paintEditorMessages) => ({
    ...paintEditorMessages,
    ...extensionMessages,
    ...interfaceMessages
});

const localeMessageOverrides = {
    ar: {
        'gui.sharedMessages.loadFromComputerTitle': 'تحميل من جهاز الكمبيوتر'
    },
    fa: {
        'gui.sharedMessages.loadFromComputerTitle': 'بارگذاری از رایانه'
    }
};

const editorMessages = {
    ar: {
        ...mergeEditorMessages(arInterface, arExtensions, arPaintEditor),
        ...localeMessageOverrides.ar
    },
    en: mergeEditorMessages(enInterface, enExtensions, enPaintEditor),
    fa: {
        ...mergeEditorMessages(faInterface, faExtensions, faPaintEditor),
        ...localeMessageOverrides.fa
    }
};

const isRtl = (locale = '') => locale === 'ar' || locale === 'fa';

export {
    editorMessages,
    isRtl
};

export default locales;
