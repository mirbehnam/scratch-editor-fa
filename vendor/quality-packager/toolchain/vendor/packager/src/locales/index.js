import {writable, derived} from 'svelte/store';
import englishMessages from '!../build/unstructure-translations-loader!./en.json';
import translations from './embedded-translations.json';

const supported = ['fa', 'ar', 'en'];
const initial = new URLSearchParams(location.search).get('locale');
const locale = writable(supported.includes(initial) ? initial : 'fa');
const localeNames = {fa: 'فارسی', ar: 'العربية', en: 'English'};
locale.subscribe(language => {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl';
});
window.addEventListener('message', event => {
  if (event.origin !== (location.protocol === 'file:' ? 'null' : location.origin) || event.source !== window.parent) return;
  if (event.data && event.data.p4 && event.data.p4.type === 'configure' && supported.includes(event.data.p4.locale)) {
    locale.set(event.data.p4.locale);
  }
});
const getEnglish = id => id.split('.').reduce((value, part) => value && value[part], englishMessages) || id;
const translate = derived(locale, language => {
  const translator = id => language === 'en' ? getEnglish(id) :
    (translations[id] && translations[id][language === 'fa' ? 0 : 1]) || getEnglish(id);
  translate.translate = translator;
  return translator;
});
export {locale, localeNames, translate as _};
