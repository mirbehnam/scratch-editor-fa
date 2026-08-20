import React from 'react';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import LibraryItem from '../../../src/components/library-item/library-item.jsx';
import {PLATFORM} from '../../../src/lib/platform.js';

jest.mock('../../../src/components/scratch-image/scratch-image.jsx', () => {
    function MockScratchImage (props) {
        return (
            <img
                data-testid="scratch-image"
                {...props}
            />
        );
    }
    MockScratchImage.displayName = 'MockScratchImage';
    MockScratchImage.ImageSourcePropType = function MockImageSourcePropType () {
        return null;
    };
    return MockScratchImage;
});

describe('LibraryItemComponent', () => {
    const handlers = {
        onBlur: jest.fn(),
        onClick: jest.fn(),
        onFocus: jest.fn(),
        onKeyDown: jest.fn(),
        onMouseEnter: jest.fn(),
        onMouseLeave: jest.fn(),
        onPlay: jest.fn(),
        onStop: jest.fn()
    };

    test('loads Android thumbnails directly from the local asset URL', () => {
        const localUri = 'https://appassets.androidplatform.net/assets/build/static/assets/cat.svg';
        const {container, queryByTestId} = renderWithIntl(
            <LibraryItem
                {...handlers}
                iconSource={{
                    assetId: 'cat',
                    assetServiceUri: 'https://cdn.assets.scratch.mit.edu/cat.svg',
                    assetType: 'ImageVector',
                    localUri
                }}
                name="Cat"
                platform={PLATFORM.ANDROID}
            />
        );

        expect(queryByTestId('scratch-image')).toBeNull();
        expect(container.querySelector('img').src).toBe(localUri);
    });
});
