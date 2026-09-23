const {runWithRetry} = require('../../../scripts/run-with-retry.cjs');

describe('Windows resource editor retry', () => {
    test('retries a temporarily locked executable', async () => {
        const spawn = jest.fn()
            .mockReturnValueOnce({status: 1})
            .mockReturnValueOnce({status: 0});
        const wait = jest.fn(() => Promise.resolve());

        await runWithRetry('rcedit.exe', ['ScratchFA.exe'], {spawn, wait});

        expect(spawn).toHaveBeenCalledTimes(2);
        expect(wait).toHaveBeenCalledTimes(1);
    });

    test('reports a persistent failure', async () => {
        const spawn = jest.fn(() => ({status: 1}));
        const wait = jest.fn(() => Promise.resolve());

        await expect(runWithRetry('rcedit.exe', ['ScratchFA.exe'], {spawn, wait}))
            .rejects.toThrow('rcedit.exe exited with code 1');
        expect(spawn).toHaveBeenCalledTimes(4);
    });
});
