import packagerMessages from './packager-messages.json';
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
        ...packagerMessages.ar,
        'gui.menuBar.package': 'إنشاء ملف المشروع',
        'gui.qualityRun.title': 'تشغيل بجودة عالية',
        'gui.qualityRun.preparing': 'جارٍ إعداد المشروع للتشغيل بجودة عالية…',
        'gui.qualityRun.failed': 'تعذر إعداد المشروع. أغلق هذه النافذة وحاول مرة أخرى.',
        'gui.qualityRun.running': 'تشغيل مباشر',
        'gui.qualityRun.closePlayer': 'إغلاق',
        'gui.qualityRun.refreshPlayer': 'تحديث',
        'gui.menuBar.preventStageDrag': 'منع سحب الكائنات أثناء التشغيل',
        'gui.sharedMessages.loadFromComputerTitle': 'تحميل من جهاز الكمبيوتر'
    },
    fa: {
        ...packagerMessages.fa,
        'gui.menuBar.package': 'ساخت خروجی پروژه',
        'gui.qualityRun.title': 'اجرای با کیفیت',
        'gui.qualityRun.preparing': 'در حال آماده‌سازی پروژه برای اجرای با کیفیت…',
        'gui.qualityRun.failed': 'آماده‌سازی پروژه انجام نشد. این پنجره را ببندید و دوباره تلاش کنید.',
        'gui.qualityRun.running': 'اجرای مستقیم',
        'gui.qualityRun.closePlayer': 'بستن',
        'gui.qualityRun.refreshPlayer': 'رفرش',
        'gui.menuBar.preventStageDrag': 'جلوگیری از کشیدن شکلک‌ها هنگام اجرا',
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
