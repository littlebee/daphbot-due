import { IServo } from "./hubState";

const ANGLE_CLOSE_ENOUGH: number = 0.5;

export function anglesCloseEnough(
    anglesA: number[],
    anglesB: number[]
): boolean {
    for (let i = 0; i < anglesA.length; i++) {
        if (Math.abs(anglesA[i] - anglesB[i]) > ANGLE_CLOSE_ENOUGH) {
            return false;
        }
    }
    return true;
}

// given 2 points in 2d space find degrees from point a to point b
export function findAngle(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    const angleDeg = (Math.atan2(y2 - y1, x2 - x1) * 360) / Math.PI;
    console.log({ x1, y1, x2, y2, angleDeg });
    return angleDeg;
}

export function mapPanTiltToXYSquare(
    panAngle: number,
    panServo: IServo,
    tiltAngle: number,
    tiltServo: IServo,
    containerSize: number,
    indicatorRadius: number
): [number, number] {
    const xf =
        panAngle - panServo.min_angle / panServo.max_angle - panServo.min_angle;
    const x =
        containerSize -
        (xf * containerSize) / (panServo.max_angle - panServo.min_angle);

    const yf =
        tiltAngle -
        tiltServo.min_angle / tiltServo.max_angle -
        tiltServo.min_angle;
    const y =
        (yf * containerSize) / (tiltServo.max_angle - tiltServo.min_angle);

    return [x - indicatorRadius, y - indicatorRadius];
}

export function mapXYToPanTilt(
    x: number,
    y: number,
    panServo: IServo,
    tiltServo: IServo,
    containerSize: number
): [number, number] {
    const panAngle =
        panServo.max_angle -
        (x * (panServo.max_angle - panServo.min_angle)) / containerSize;
    const tiltAngle =
        (y * (tiltServo.max_angle - tiltServo.min_angle)) / containerSize +
        tiltServo.min_angle;

    return [panAngle, tiltAngle];
}
