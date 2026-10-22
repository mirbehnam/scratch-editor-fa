const STORAGE_KEY = 'scratch.android.preventStageDrag';

const isAndroidStageDragAvailable = () =>
    process.env.SCRATCH_ANDROID_TOUCH === 'true' && (
        /android/i.test(navigator.userAgent) ||
        // The Android host uses a desktop user agent with WebViewAssetLoader.
        window.location.origin === 'https://appassets.androidplatform.net'
    );

const readPreventStageDrag = () => {
    if (!isAndroidStageDragAvailable()) return false;
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('readPreventStageDrag: unable to read Android touch preference', error);
        return false;
    }
};

const persistPreventStageDrag = enabled => {
    try {
        localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('persistPreventStageDrag: unable to save Android touch preference', {enabled, error});
    }
};

export {isAndroidStageDragAvailable, readPreventStageDrag, persistPreventStageDrag};
