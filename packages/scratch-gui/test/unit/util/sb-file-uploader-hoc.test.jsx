import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import {act} from '@testing-library/react';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import VM from '@scratch/scratch-vm';

import SBFileUploaderHOC from '../../../src/lib/sb-file-uploader-hoc.jsx';
import {IntlProvider} from 'react-intl';

describe('SBFileUploaderHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    // Wrap this in a function so it gets test specific states and can be reused.
    const getContainer = function () {
        const Component = () => <div />;
        return SBFileUploaderHOC(Component);
    };

    const renderUploader = (props = {}) => {
        const WrappedComponent = getContainer();
        // default starting state: looking at a project you created, not logged in
        const wrapper = renderWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={jest.fn()}
                closeFileMenu={jest.fn()}
                requestProjectUpload={jest.fn()}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
                store={store}
                {...props}
            />
        );
        return wrapper;
    };

    beforeEach(() => {
        vm = new VM();
        store = mockStore({
            scratchGui: {
                projectState: {
                    loadingState: LoadingState.SHOWING_WITHOUT_ID
                },
                vm: {}
            },
            locales: {
                locale: 'en'
            }
        });
    });

    afterEach(() => {
        delete window.AndroidProjectSaver;
        delete window.AndroidScratchLoadProject;
        delete window.AndroidScratchLoadProjectUrl;
        delete global.fetch;
    });

    test('exposes Android project loader APIs and reports readiness', () => {
        window.AndroidProjectSaver = {
            projectLoaderReady: jest.fn()
        };

        const {unmount} = renderUploader();

        expect(typeof window.AndroidScratchLoadProject).toBe('function');
        expect(typeof window.AndroidScratchLoadProjectUrl).toBe('function');
        expect(window.AndroidProjectSaver.projectLoaderReady).toHaveBeenCalledTimes(1);

        unmount();
        expect(window.AndroidScratchLoadProject).toBeUndefined();
        expect(window.AndroidScratchLoadProjectUrl).toBeUndefined();
    });

    test('queues an Android project URL through the standard upload flow', async () => {
        const projectData = new ArrayBuffer(4);
        const requestProjectUpload = jest.fn();
        window.AndroidProjectSaver = {
            projectLoadStarted: jest.fn()
        };
        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(projectData)
        }));
        renderUploader({requestProjectUpload});

        await act(() => window.AndroidScratchLoadProjectUrl(
            'https://appassets.androidplatform.net/projects/example.sb3',
            'example.sb3'
        ));

        expect(window.AndroidProjectSaver.projectLoadStarted).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://appassets.androidplatform.net/projects/example.sb3'
        );
        expect(requestProjectUpload).toHaveBeenCalledWith(LoadingState.SHOWING_WITHOUT_ID);
    });

    test('if isLoadingUpload becomes true, without fileToUpload set, will call cancelFileUpload', () => {
        const mockedCancelFileUpload = jest.fn();
        const WrappedComponent = getContainer();
        const {rerender} = renderWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={mockedCancelFileUpload}
                closeFileMenu={jest.fn()}
                isLoadingUpload={false}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );
        rerender(
            <IntlProvider
                locale="en"
                messages={{ }}
            >
                <WrappedComponent
                    projectChanged
                    canSave={false}
                    cancelFileUpload={mockedCancelFileUpload}
                    closeFileMenu={jest.fn()}
                    isLoadingUpload
                    requestProjectUpload={jest.fn()}
                    store={store}
                    userOwnsProject={false}
                    vm={vm}
                    onLoadingFinished={jest.fn()}
                    onLoadingStarted={jest.fn()}
                    onUpdateProjectTitle={jest.fn()}
                />
            </IntlProvider>
        );
        expect(mockedCancelFileUpload).toHaveBeenCalled();
    });
});
