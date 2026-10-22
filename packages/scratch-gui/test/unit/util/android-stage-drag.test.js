import {isAndroidStageDragAvailable, readPreventStageDrag, persistPreventStageDrag}
    from '../../../src/lib/android-stage-drag';

describe('Android stage drag preference', () => {
    const originalBuild = process.env.SCRATCH_ANDROID_TOUCH;
    let userAgent;
    let location;
    beforeEach(() => {
        userAgent = jest.spyOn(navigator, 'userAgent', 'get');
        location = jest.spyOn(window, 'location', 'get');
        process.env.SCRATCH_ANDROID_TOUCH = 'true';
        localStorage.clear();
    });
    afterEach(() => {
        userAgent.mockRestore();
        location.mockRestore();
        if (typeof originalBuild === 'undefined') delete process.env.SCRATCH_ANDROID_TOUCH;
        else process.env.SCRATCH_ANDROID_TOUCH = originalBuild;
    });
    test('Android offline build remembers an opt-in preference', () => {
        userAgent.mockReturnValue('Mozilla/5.0 (Linux; Android 14)');
        expect(isAndroidStageDragAvailable()).toBe(true);
        expect(readPreventStageDrag()).toBe(false);
        persistPreventStageDrag(true);
        expect(readPreventStageDrag()).toBe(true);
        persistPreventStageDrag(false);
        expect(readPreventStageDrag()).toBe(false);
    });
    test('Windows ignores the preference in the shared offline bundle', () => {
        userAgent.mockReturnValue('Mozilla/5.0 (Windows NT 10.0) Electron/42');
        persistPreventStageDrag(true);
        expect(isAndroidStageDragAvailable()).toBe(false);
        expect(readPreventStageDrag()).toBe(false);
    });
    test('Android asset origin is recognized with the host app desktop user agent', () => {
        userAgent.mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0');
        location.mockReturnValue({origin: 'https://appassets.androidplatform.net'});
        expect(isAndroidStageDragAvailable()).toBe(true);
        persistPreventStageDrag(true);
        expect(readPreventStageDrag()).toBe(true);
        process.env.SCRATCH_ANDROID_TOUCH = 'false';
        expect(isAndroidStageDragAvailable()).toBe(false);
    });
    test('similar origins do not enable Android controls on desktop', () => {
        userAgent.mockReturnValue('Windows');
        location.mockReturnValue({origin: 'https://appassets.androidplatform.net.example.com'});
        expect(isAndroidStageDragAvailable()).toBe(false);
    });
    test('standard builds do not enable the feature even on Android', () => {
        userAgent.mockReturnValue('Android');
        process.env.SCRATCH_ANDROID_TOUCH = 'false';
        expect(isAndroidStageDragAvailable()).toBe(false);
    });
});
