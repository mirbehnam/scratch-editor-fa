import {ScratchPaintReducer} from '@scratch/scratch-paint';
import LocalesReducer, {localesInitialState, initLocale, selectLocale} from './reducers/locales.js';
import GuiReducer, {
    buildGuiMiddleware,
    buildInitialState,
    guiMiddleware,
    initEmbedded,
    initFullScreen,
    initPlayer
} from './reducers/gui';
import {setFullScreen, setPlayer, setEmbedded} from './reducers/mode.js';
import {
    LoadingStates,
    onFetchedProjectData,
    onLoadedProject,
    defaultProjectId,
    manualUpdateProject,
    remixProject,
    requestNewProject,
    requestProjectUpload,
    setProjectId
} from './reducers/project-state.js';
import {
    openBackdropLibrary,
    openCostumeLibrary,
    openDebugModal,
    openExtensionLibrary,
    openLoadingProject,
    openTelemetryModal,
    openSoundLibrary,
    openSpriteLibrary,
    openSoundRecorder,
    openConnectionModal,
    closeBackdropLibrary,
    closeCostumeLibrary,
    closeDebugModal,
    closeExtensionLibrary,
    closeLoadingProject,
    closeTelemetryModal,
    closeSpriteLibrary,
    closeSoundLibrary,
    closeSoundRecorder,
    closeConnectionModal
} from './reducers/modals.js';
import {setStageSize} from './reducers/stage-size';

export const guiReducers = {
    locales: LocalesReducer,
    scratchGui: GuiReducer,
    scratchPaint: ScratchPaintReducer
};

export {
    LoadingStates,
    onFetchedProjectData,
    onLoadedProject,
    defaultProjectId,
    manualUpdateProject,
    remixProject,
    requestNewProject,
    requestProjectUpload,
    setProjectId,
    setStageSize,

    openBackdropLibrary,
    openCostumeLibrary,
    openDebugModal,
    openExtensionLibrary,
    openLoadingProject,
    openTelemetryModal,
    openSoundLibrary,
    openSpriteLibrary,
    openSoundRecorder,
    openConnectionModal,
    closeBackdropLibrary,
    closeCostumeLibrary,
    closeDebugModal,
    closeExtensionLibrary,
    closeLoadingProject,
    closeTelemetryModal,
    closeSpriteLibrary,
    closeSoundLibrary,
    closeSoundRecorder,
    closeConnectionModal,
    
    buildGuiMiddleware,
    buildInitialState,
    guiMiddleware,
    initEmbedded,
    initPlayer,
    initFullScreen,
    initLocale,
    localesInitialState,
    setFullScreen,
    setPlayer,
    setEmbedded,
    selectLocale
};
