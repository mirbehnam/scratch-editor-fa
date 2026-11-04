import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react';
import {IntlProvider} from 'react-intl';
import PackagerModal from '../../../src/components/packager-modal/packager-modal.jsx';
import {createPackagerSnapshot, clearPackagerSnapshot} from '../../../src/lib/packager-snapshot.js';
import {exportPackagedFile} from '../../../src/lib/quality-run-export.js';

jest.mock('../../../src/lib/packager-snapshot.js', () => ({createPackagerSnapshot: jest.fn(), clearPackagerSnapshot: jest.fn()}));
jest.mock('../../../src/lib/quality-run-export.js', () => ({
    ...jest.requireActual('../../../src/lib/quality-run-export.js'), exportPackagedFile: jest.fn()
}));
jest.mock('../../../src/components/modal/modal.jsx', () => {
    const ReactMock = require('react');
    return function MockModal ({children}) {
        return ReactMock.createElement('div', {role: 'dialog'}, children);
    };
});

test('manual packager imports the current snapshot, saves HTML to the native library and cleans its snapshot', async () => {
    const buffer = new ArrayBuffer(4);
    createPackagerSnapshot.mockResolvedValue({buffer, name: 'Project.sb3'});
    clearPackagerSnapshot.mockResolvedValue();
    exportPackagedFile.mockResolvedValue({name: 'Project.html', location: 'library'});
    const vm = {saveProjectSb3: jest.fn()};
    const view = render(<IntlProvider locale="en"><PackagerModal
        vm={vm}
        title="Project"
        onClose={jest.fn()}
    /></IntlProvider>);
    await waitFor(() => expect(document.querySelector('iframe')).not.toBeNull());
    const frame = document.querySelector('iframe');
    expect(frame.src).toContain('quality-packager/index.html');
    expect(frame.src).not.toContain('autobuild');
    frame.contentWindow.postMessage = jest.fn();
    const receive = data => act(() => window.dispatchEvent(new MessageEvent('message', {
        source: frame.contentWindow, origin: location.origin, data: {p4: data}
    })));
    receive({type: 'ready-for-import'});
    expect(frame.contentWindow.postMessage).toHaveBeenCalledWith(
        {p4: {type: 'finish-import', name: 'Project.sb3', data: buffer}}, location.origin, [buffer]);
    const blob = new Blob(['project'], {type: 'text/html'});
    receive({type: 'export-ready', name: 'Project.html', blob});
    fireEvent.click(view.getByRole('button', {name: 'Save'}));
    await waitFor(() => expect(view.getByRole('status').textContent).toContain('Saved in My Projects'));
    expect(exportPackagedFile).toHaveBeenCalledWith(blob, 'Project.html', 'save', 'en');
    view.unmount();
    expect(clearPackagerSnapshot).toHaveBeenCalledWith(expect.any(String));
});
