export type AnyTouchEvent =
    | React.TouchEvent
    | React.MouseEvent
    | MouseEvent
    | TouchEvent;

export function isTouchEvent(
    e: AnyTouchEvent
): e is React.TouchEvent | TouchEvent {
    if (e instanceof TouchEvent) {
        return true;
    }
    if (e instanceof MouseEvent) {
        return false;
    }
    // ^ native event, below is React event
    return e.nativeEvent instanceof TouchEvent;
}

// returns [x, y] coordinates of the mouse or touch event
export function getClientXY(e: AnyTouchEvent): [number, number] {
    if (isTouchEvent(e)) {
        const touch = e.touches[0];
        return [touch.clientX, touch.clientY];
    }
    return [e.clientX, e.clientY];
}
