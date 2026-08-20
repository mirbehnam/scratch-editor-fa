const normalizeSearchText = value => String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإٱآ]/g, 'ا')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .replace(/[\u06F0-\u06F9]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/(?:\u200C|\u200D|\u200E|\u200F)/g, '')
    .trim();

const libraryItemMatchesQuery = (item, query, displayName) => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;

    return [item.name, displayName, ...(item.tags || [])]
        .filter(value => typeof value === 'string')
        .some(value => normalizeSearchText(value).includes(normalizedQuery));
};

export {normalizeSearchText};
export default libraryItemMatchesQuery;
