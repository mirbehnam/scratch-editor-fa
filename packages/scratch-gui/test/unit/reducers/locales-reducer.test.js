import reducer, {localesInitialState, selectLocale} from '../../../src/reducers/locales';

describe('locales reducer', () => {
    test('starts in Persian with right-to-left layout', () => {
        expect(localesInitialState.locale).toBe('fa');
        expect(localesInitialState.isRtl).toBe(true);
        expect(localesInitialState.messages).toBe(localesInitialState.messagesByLocale.fa);
    });

    test('ignores attempts to select an unsupported locale', () => {
        const state = reducer(localesInitialState, selectLocale('es'));

        expect(state).toBe(localesInitialState);
    });
});
