import guiReducer, {buildInitialState} from '../../../src/reducers/gui';
import modalReducer, {
    modalsInitialState,
    openSpriteLibrary,
    openBackdropLibrary,
    openSoundLibrary
} from '../../../src/reducers/modals';
import Library from '../../../src/components/library/library.jsx';
import {legacyConfig} from '../../../src/legacy-config';

describe('editor without bundled tutorials', () => {
    test('initial state has no tutorial state and retains editor state', () => {
        const config = legacyConfig;
        const state = buildInitialState(config);
        expect(state).not.toHaveProperty('cards');
        expect(state.config).toBe(config);
        expect(state).toHaveProperty('targets');
        expect(state).toHaveProperty('customProcedures');
        expect(guiReducer(state, {type: '@@INIT'})).not.toHaveProperty('cards');
        expect(modalsInitialState).not.toHaveProperty('tipsLibrary');
    });

    test.each([
        ['spriteLibrary', openSpriteLibrary],
        ['backdropLibrary', openBackdropLibrary],
        ['soundLibrary', openSoundLibrary]
    ])('keeps the %s modal functional', (name, open) => {
        expect(modalReducer(modalsInitialState, open())[name]).toBe(true);
    });

    test('keeps library item rendering and asset URLs', () => {
        const data = [
            {name: 'Cat', rawURL: 'static/assets/cat.svg'},
            {name: 'Sound', rawURL: 'static/assets/sound.svg'}
        ];
        const library = new Library.WrappedComponent({data});
        const items = library.renderData(data);
        expect(items.map(item => item.props.name)).toEqual(['Cat', 'Sound']);
        expect(items[0].props.icons.uri).toBe('static/assets/cat.svg');
        expect(items[1].props.icons.uri).toBe('static/assets/sound.svg');
    });
});
