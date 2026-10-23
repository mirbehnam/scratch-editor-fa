import React from 'react';
import ReactModal from 'react-modal';
import {fireEvent} from '@testing-library/react';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import Prompt from '../../../src/components/prompt/prompt.jsx';

jest.mock('../../../src/containers/modal.jsx', () =>
    require('../../../src/components/modal/modal.jsx').default
);

describe('prompt overlay touch', () => {
    beforeEach(() => {
        ReactModal.setAppElement(document.createElement('div'));
    });
    afterEach(() => {
        delete window.AndroidScratchTextInput;
    });
    const renderPrompt = onCancel => renderWithIntl(<Prompt
        canAddCloudVariable={false}
        cloudSelected={false}
        globalSelected
        isStage={false}
        label="Message name"
        showCloudOption={false}
        showListMessage={false}
        showVariableOptions={false}
        title="New message"
        onCancel={onCancel}
        onChange={jest.fn()}
        onFocus={jest.fn()}
        onKeyPress={jest.fn()}
        onOk={jest.fn()}
        onScopeOptionSelection={jest.fn()}
    />);

    test('native prompt ignores the click delivered after the opening touch ends', () => {
        window.AndroidScratchTextInput = {};
        const onCancel = jest.fn();
        const {getByText} = renderPrompt(onCancel);
        fireEvent.click(document.querySelector('.ReactModal__Overlay'));
        expect(onCancel).not.toHaveBeenCalled();
        getByText('Cancel').click();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('desktop prompt still dismisses on overlay click', () => {
        const onCancel = jest.fn();
        renderPrompt(onCancel);
        fireEvent.click(document.querySelector('.ReactModal__Overlay'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});
