const patchedPrototypes = new WeakSet();

const installRtlSelectionOutline = ScratchBlocks => {
    const prototype = ScratchBlocks.zelos.PathObject.prototype;
    if (patchedPrototypes.has(prototype)) return;

    const flipRTL = prototype.flipRTL;
    /* eslint-disable @typescript-eslint/no-invalid-this */
    prototype.flipRTL = function (...args) {
        const result = flipRTL.apply(this, args);
        // A selection created before the first render must mirror the main path too.
        for (const path of this.svgRoot.children) {
            if (path.classList.contains('blocklyPathSelected')) {
                path.setAttribute('transform', this.svgPath.getAttribute('transform'));
            }
        }
        return result;
    };
    /* eslint-enable @typescript-eslint/no-invalid-this */
    patchedPrototypes.add(prototype);
};

export default installRtlSelectionOutline;
