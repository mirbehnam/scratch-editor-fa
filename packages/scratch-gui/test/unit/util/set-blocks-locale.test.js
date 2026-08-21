import setBlocksLocale from '../../../src/lib/set-blocks-locale';

describe('setBlocksLocale', () => {
    const createScratchBlocks = () => {
        const ScratchBlocks = {
            Msg: {},
            ScratchMsgs: {
                setLocale: jest.fn((...args) => {
                    const locale = args[0];
                    if (locale === 'fa' || locale === 'ar') {
                        Object.assign(ScratchBlocks.Msg, {
                            OPERATORS_ADD: '%2 + %1',
                            OPERATORS_SUBTRACT: '%2 - %1',
                            OPERATORS_MULTIPLY: '%2 * %1',
                            OPERATORS_DIVIDE: '%2 / %1',
                            OPERATORS_GT: 'incorrect greater than',
                            OPERATORS_LT: 'incorrect less than'
                        });
                    }
                })
            }
        };
        return ScratchBlocks;
    };

    test('corrects only the Persian comparison operator symbols', () => {
        const ScratchBlocks = createScratchBlocks();

        setBlocksLocale(ScratchBlocks, 'fa');

        expect(ScratchBlocks.ScratchMsgs.setLocale).toHaveBeenCalledWith('fa');
        expect(ScratchBlocks.Msg).toEqual({
            OPERATORS_ADD: '%2 + %1',
            OPERATORS_SUBTRACT: '%2 - %1',
            OPERATORS_MULTIPLY: '%2 * %1',
            OPERATORS_DIVIDE: '%2 / %1',
            OPERATORS_GT: '%2 > %1',
            OPERATORS_LT: '%2 < %1'
        });
    });

    test('uses the Arabic comparison operator order', () => {
        const ScratchBlocks = createScratchBlocks();

        setBlocksLocale(ScratchBlocks, 'ar');

        expect(ScratchBlocks.Msg.OPERATORS_GT).toBe('%1 > %2');
        expect(ScratchBlocks.Msg.OPERATORS_LT).toBe('%1 < %2');
    });

    test('leaves comparison messages unchanged for other locales', () => {
        const ScratchBlocks = createScratchBlocks();
        Object.assign(ScratchBlocks.Msg, {
            OPERATORS_GT: '%1 > %2',
            OPERATORS_LT: '%1 < %2'
        });

        setBlocksLocale(ScratchBlocks, 'en');

        expect(ScratchBlocks.Msg.OPERATORS_GT).toBe('%1 > %2');
        expect(ScratchBlocks.Msg.OPERATORS_LT).toBe('%1 < %2');
    });
});
