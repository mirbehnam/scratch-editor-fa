import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react';
import {IntlProvider} from 'react-intl';
import QualityRunButton from '../../../src/components/quality-run/quality-run.jsx';

jest.mock('../../../src/components/modal/modal.jsx', () => {
    const ReactMock = require('react');
    return function MockModal ({children, onRequestClose}) {
        return ReactMock.createElement('div', {role: 'dialog'},
            ReactMock.createElement('button', {onClick: onRequestClose}, 'Cancel preparation'), children);
    };
});

const mount = vm => render(<IntlProvider locale="en"><QualityRunButton
    vm={vm}
    title="Test"
/></IntlProvider>);
const receive = (frame, data, source = frame.contentWindow, origin = location.origin) => {
    act(() => window.dispatchEvent(new MessageEvent('message', {source, origin, data: {p4: data}})));
};

describe('high-quality run lifecycle', () => {
    beforeEach(() => {
        URL.createObjectURL = jest.fn(() => 'blob:test-player');
        URL.revokeObjectURL = jest.fn();
    });
    test('builds a snapshot, isolates playback and releases builder and player on close', async () => {
        const buffer = new ArrayBuffer(4);
        const vm = {saveProjectSb3: jest.fn(() => Promise.resolve({arrayBuffer: () => Promise.resolve(buffer)}))};
        const view = mount(vm);
        fireEvent.click(view.getByText('Run with high quality'));
        await waitFor(() => expect(view.container.ownerDocument.querySelector('iframe')).not.toBeNull());
        const builder = document.querySelector('iframe');
        expect(builder.src).toContain('autobuild=high');
        builder.contentWindow.postMessage = jest.fn();
        receive(builder, {type: 'ready-for-import'});
        expect(builder.contentWindow.postMessage).toHaveBeenCalledWith(
            {p4: {type: 'finish-import', name: 'Test.sb3', data: buffer}}, location.origin, [buffer]);
        const blob = new Blob(['<html>game</html>'], {type: 'text/html'});
        receive(builder, {type: 'export-ready', blob, name: 'Test.html'});
        await waitFor(() => expect(document.querySelector('iframe[sandbox]')).not.toBeNull());
        expect(builder.isConnected).toBe(false);
        expect(document.querySelectorAll('iframe')).toHaveLength(1);
        expect(document.querySelector('iframe').getAttribute('sandbox')).not.toContain('allow-same-origin');
        fireEvent.click(view.getByRole('button', {name: 'Close'}));
        expect(document.querySelectorAll('iframe')).toHaveLength(0);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-player');
        expect(vm.saveProjectSb3).toHaveBeenCalledTimes(1);
    });
    test('closing while snapshot is pending prevents a late builder from mounting', async () => {
        let finish;
        const vm = {saveProjectSb3: jest.fn(() => new Promise(resolve => {
            finish = resolve;
        }))};
        const view = mount(vm);
        fireEvent.click(view.getByText('Run with high quality'));
        fireEvent.click(view.getByText('Cancel preparation'));
        await act(async () => {
            finish({arrayBuffer: () => Promise.resolve(new ArrayBuffer(4))});
            await Promise.resolve();
        });
        expect(document.querySelector('iframe')).toBeNull();
        expect(view.queryByRole('dialog')).toBeNull();
    });
    test('rejects forged export messages from a different frame or origin', async () => {
        const view = mount({saveProjectSb3: () => Promise.resolve({arrayBuffer: () => Promise.resolve(new ArrayBuffer(4))})});
        fireEvent.click(view.getByText('Run with high quality'));
        await waitFor(() => expect(document.querySelector('iframe')).not.toBeNull());
        const builder = document.querySelector('iframe');
        const data = {type: 'export-ready', blob: new Blob(['x']), name: 'x.html'};
        receive(builder, data, window);
        receive(builder, data, builder.contentWindow, 'https://wrong.example');
        expect(document.querySelector('iframe[sandbox]')).toBeNull();
        expect(builder.isConnected).toBe(true);
    });
});
