import {detectColorMode} from '../lib/settings/color-mode/persistence';
import {detectTheme} from '../lib/settings/theme/persistence';
import {readPreventStageDrag} from '../lib/android-stage-drag';

const SET_PREVENT_STAGE_DRAG = 'scratch-gui/settings/SET_PREVENT_STAGE_DRAG';

const SET_COLOR_MODE = 'scratch-gui/settings/SET_COLOR_MODE';
const SET_THEME = 'scratch-gui/settings/SET_THEME';

const initialState = {
    preventStageDrag: readPreventStageDrag(),
    colorMode: detectColorMode(),
    theme: detectTheme()
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
    case SET_PREVENT_STAGE_DRAG:
        return {...state, preventStageDrag: action.enabled};
    case SET_COLOR_MODE:
        return {...state, colorMode: action.colorMode};
    case SET_THEME:
        return {...state, theme: action.theme};
    default:
        return state;
    }
};

const setColorMode = colorMode => ({
    type: SET_COLOR_MODE,
    colorMode
});

const setTheme = theme => ({
    type: SET_THEME,
    theme
});

const setPreventStageDrag = enabled => ({type: SET_PREVENT_STAGE_DRAG, enabled});

export {
    reducer as default,
    initialState as settingsInitialState,
    setColorMode,
    setPreventStageDrag,
    setTheme
};
