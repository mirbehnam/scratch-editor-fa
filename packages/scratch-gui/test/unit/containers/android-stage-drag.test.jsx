import StageContainer from '../../../src/containers/stage.jsx';

const Stage = StageContainer.WrappedComponent;

describe('Android stage drag lock', () => {
    let stage;
    let vm;
    const touch = (x = 20, y = 30) => new TouchEvent('touchstart', {
        changedTouches: [{clientX: x, clientY: y}],
        touches: [{clientX: x, clientY: y}]
    });

    beforeEach(() => {
        jest.useFakeTimers();
        vm = {
            renderer: {canvas: {getBoundingClientRect: () => ({left: 0, top: 0, width: 480, height: 360})}},
            attachV2BitmapAdapter: jest.fn(),
            postIOData: jest.fn()
        };
        stage = new Stage({vm, blockTouchDrag: true});
        stage.setState = update => Object.assign(stage.state, update);
        stage.onStartDrag = jest.fn();
    });

    afterEach(() => jest.useRealTimers());

    test('locked touch sends mouse down, movement and up without starting a drag', () => {
        stage.onMouseDown(touch());
        stage.onMouseMove(touch(100, 120));
        jest.advanceTimersByTime(500);
        stage.onMouseUp(touch(100, 120));
        expect(stage.onStartDrag).not.toHaveBeenCalled();
        expect(vm.postIOData.mock.calls.map(call => call[1])).toEqual([
            expect.objectContaining({isDown: true, x: 20, y: 30}),
            expect.objectContaining({x: 100, y: 120}),
            expect.objectContaining({isDown: false, wasDragged: false})
        ]);
    });

    test('unlocked touch still starts a drag on movement', () => {
        stage.props = {...stage.props, blockTouchDrag: false};
        stage.onMouseDown(touch());
        stage.onMouseMove(touch(100, 120));
        expect(stage.onStartDrag).toHaveBeenCalledWith(20, 30);
    });

    test('cancelled touch releases the mouse without firing a release click', () => {
        stage.onMouseDown(touch());
        stage.onTouchCancel(touch());
        jest.advanceTimersByTime(500);
        expect(stage.onStartDrag).not.toHaveBeenCalled();
        expect(vm.postIOData).toHaveBeenLastCalledWith('mouse', expect.objectContaining({
            isDown: false, wasDragged: true
        }));
    });

    test('a pending drag is rejected if the lock becomes active during the touch', () => {
        stage.isTouchGesture = true;
        Stage.prototype.onStartDrag.call(stage, 20, 30);
        expect(stage.state.isDragging).toBe(false);
    });

    test('a physical mouse still starts a drag even when the touch lock is active', () => {
        stage.onMouseDown(new MouseEvent('mousedown', {button: 0, clientX: 20, clientY: 30}));
        jest.advanceTimersByTime(400);
        expect(stage.onStartDrag).toHaveBeenCalledWith(20, 30);
    });
});
