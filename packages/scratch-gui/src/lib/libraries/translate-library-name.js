import backdrops from './backdrops.json';
import sounds from './sounds.json';
import sprites from './sprites.json';
import translatePersianLibraryName from './translations/fa.js';

const builtInNames = {
    backdrops: new Set(backdrops.map(item => item.name)),
    sounds: new Set(sounds.map(item => item.name)),
    sprites: new Set(sprites.map(item => item.name))
};

const translators = {
    fa: translatePersianLibraryName
};

const translateLibraryName = (library, name, locale) => {
    const language = (locale || '').toLowerCase().split('-')[0];
    const translator = translators[language];

    if (!translator || !builtInNames[library] || !builtInNames[library].has(name)) return name;
    return translator(library, name);
};

export default translateLibraryName;
