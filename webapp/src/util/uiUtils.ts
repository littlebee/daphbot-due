export function isTouchEvent(
    e: React.TouchEvent | React.MouseEvent
): e is React.TouchEvent {
    return e.nativeEvent instanceof TouchEvent;
}
