const getDocumentBaseURL = () => {
    if (typeof document === 'undefined') return null;

    return document.baseURI;
};

/**
 * Resolve a file copied to the application's static directory against the page URL.
 * @param {string} path path relative to the static directory
 * @param {string} [baseURL] document URL override
 * @returns {string} URL suitable for storage and image elements
 */
const getStaticURL = (path, baseURL = getDocumentBaseURL()) => {
    const relativeURL = `static/${path}`;

    return baseURL ? new URL(relativeURL, baseURL).href : relativeURL;
};

export default getStaticURL;
