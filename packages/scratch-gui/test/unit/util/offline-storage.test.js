jest.mock('../../../src/lib/static-url', () => path => `http://localhost/static/${path}`);

import {LegacyStorage} from '../../../src/lib/legacy-storage';

describe('offline storage helper', () => {
    const nativeFetch = global.fetch;
    const NativeRequest = global.Request;

    afterEach(() => {
        global.fetch = nativeFetch;
        global.Request = NativeRequest;
    });

    test('loads a bundled asset without using a cached response', async () => {
        const storage = new LegacyStorage().scratchStorage;
        const data = new Uint8Array([1, 2, 3]);
        global.Request = class MockRequest {
            constructor (url) {
                this.url = url;
            }
        };
        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(data.buffer)
        }));

        const asset = await storage.load(storage.AssetType.ImageVector, 'asset-id', storage.DataFormat.SVG);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch.mock.calls[0][0].url).toBe('http://localhost/static/assets/asset-id.svg');
        expect(global.fetch.mock.calls[0][1]).toEqual({cache: 'no-store'});
        expect(Array.from(asset.data)).toEqual([1, 2, 3]);
    });
});
