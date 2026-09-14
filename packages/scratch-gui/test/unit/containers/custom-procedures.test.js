import {PLATFORM} from '../../../src/lib/platform.js';
import {shouldAutoFocusEditor} from '../../../src/containers/custom-procedures.jsx';

describe('CustomProcedures container', () => {
    test('does not focus the editor automatically on Android', () => {
        expect(shouldAutoFocusEditor(PLATFORM.ANDROID)).toBe(false);
    });

    test('keeps automatic editor focus on desktop', () => {
        expect(shouldAutoFocusEditor(PLATFORM.DESKTOP)).toBe(true);
    });
});
