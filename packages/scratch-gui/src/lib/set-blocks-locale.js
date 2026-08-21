const COMPARISON_MESSAGES_BY_LOCALE = {
    ar: {
        OPERATORS_GT: '%1 > %2',
        OPERATORS_LT: '%1 < %2'
    },
    fa: {
        OPERATORS_GT: '%2 > %1',
        OPERATORS_LT: '%2 < %1'
    }
};

const setBlocksLocale = (ScratchBlocks, locale) => {
    ScratchBlocks.ScratchMsgs.setLocale(locale);

    if (COMPARISON_MESSAGES_BY_LOCALE[locale]) {
        Object.assign(ScratchBlocks.Msg, COMPARISON_MESSAGES_BY_LOCALE[locale]);
    }
};

export default setBlocksLocale;
