import installRtlSelectionOutline from '../../../src/lib/rtl-selection-outline';

describe('RTL selection outline', () => {
    let ScratchBlocks;
    let originalFlip;
    let pathObject;
    const createPath = () => document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const select = () => {
        const outline = pathObject.svgPath.cloneNode(true);
        outline.classList.add('blocklyPathSelected');
        pathObject.svgRoot.appendChild(outline);
        return outline;
    };

    beforeEach(() => {
        originalFlip = jest.fn(function () {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.svgPath.setAttribute('transform', 'scale(-1 1)');
        });
        class PathObject {}
        PathObject.prototype.flipRTL = originalFlip;
        ScratchBlocks = {zelos: {PathObject}};
        pathObject = new PathObject();
        pathObject.svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        pathObject.svgPath = createPath();
        pathObject.svgRoot.appendChild(pathObject.svgPath);
    });

    test('mirrors an outline selected before the first RTL render', () => {
        const outline = select();
        installRtlSelectionOutline(ScratchBlocks);
        pathObject.flipRTL();
        expect(outline.getAttribute('transform')).toBe('scale(-1 1)');
        expect(originalFlip).toHaveBeenCalledTimes(1);
    });

    test('keeps an outline selected after RTL rendering aligned on rerender', () => {
        installRtlSelectionOutline(ScratchBlocks);
        pathObject.flipRTL();
        const outline = select();
        pathObject.flipRTL();
        expect(outline.getAttribute('transform')).toBe(pathObject.svgPath.getAttribute('transform'));
    });

    test('does not transform LTR paths or unrelated child paths', () => {
        const unrelated = createPath();
        pathObject.svgRoot.appendChild(unrelated);
        installRtlSelectionOutline(ScratchBlocks);
        const outline = select();
        expect(outline.hasAttribute('transform')).toBe(false);
        pathObject.flipRTL();
        expect(unrelated.hasAttribute('transform')).toBe(false);
    });

    test('installs only once when blocks are initialized repeatedly', () => {
        installRtlSelectionOutline(ScratchBlocks);
        const patched = ScratchBlocks.zelos.PathObject.prototype.flipRTL;
        installRtlSelectionOutline(ScratchBlocks);
        expect(ScratchBlocks.zelos.PathObject.prototype.flipRTL).toBe(patched);
        pathObject.flipRTL();
        expect(originalFlip).toHaveBeenCalledTimes(1);
    });
});
