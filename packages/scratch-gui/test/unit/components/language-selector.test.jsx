import React from 'react';
import {render} from '@testing-library/react';

import LanguageSelector from '../../../src/components/language-selector/language-selector';

describe('LanguageSelector', () => {
    test('renders only Arabic, English and Persian', () => {
        const {getAllByRole} = render(<LanguageSelector
            currentLocale="fa"
            label="Language"
            onChange={jest.fn()}
        />);

        expect(getAllByRole('option').map(({value}) => value)).toEqual(['ar', 'en', 'fa']);
    });
});
