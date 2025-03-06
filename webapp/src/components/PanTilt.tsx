/*
A react component that allows the user to control the pan and tilt of the camera using
a two dimension click to move interface.  The user clicks on div and depending on where
they click the camera will pan and tilt to that position using the servos from central
hub key `servo_config` named "pan" and "tilt".
*/

import { useMemo, useCallback } from "react";

import { IServoConfig, IServo } from "../util/hubState";
import { sendHubStateUpdate } from "../util/hubMessages";
import { mapPanTiltToXYSquare, mapXYToPanTilt } from "../util/angleUtils";
import { isTouchEvent } from "../util/uiUtils";
import st from "./PanTilt.module.css";

const TOUCH_GRID_SIZE = 200;
const ANGLE_INDICATOR_RADUIS = 10;
const ACTUAL_INDICATOR_RADUIS = 8;

export interface PanTiltProps {
    // These are passed from the hubState and may be null or undefined while the
    // backend is restarting
    servoConfig?: IServoConfig;
    servoAngles?: Record<string, number>;
    servoActualAngles?: Record<string, number>;
}

export function PanTilt({
    servoConfig,
    servoAngles,
    servoActualAngles,
}: PanTiltProps) {
    const [panServo, tiltServo]: [IServo | null, IServo | null] =
        useMemo(() => {
            let pan = null;
            let tilt = null;
            if (servoConfig) {
                for (const servo of servoConfig.servos) {
                    if (servo.name === "pan") {
                        pan = servo;
                    } else if (servo.name === "tilt") {
                        tilt = servo;
                    }
                }
            }
            return [pan, tilt];
        }, [servoConfig]);

    const [angleX, angleY]: [number, number] = useMemo(() => {
        if (!panServo || !tiltServo || !servoAngles) {
            return [0, 0];
        }
        return mapPanTiltToXYSquare(
            servoAngles["pan"],
            panServo,
            servoAngles["tilt"],
            tiltServo,
            TOUCH_GRID_SIZE,
            ANGLE_INDICATOR_RADUIS
        );
    }, [servoAngles, panServo, tiltServo]);

    const [angleActualX, angleActualY]: [number, number] = useMemo(() => {
        if (!panServo || !tiltServo || !servoActualAngles) {
            return [0, 0];
        }
        return mapPanTiltToXYSquare(
            servoActualAngles["pan"],
            panServo,
            servoActualAngles["tilt"],
            tiltServo,
            TOUCH_GRID_SIZE,
            ACTUAL_INDICATOR_RADUIS
        );
    }, [servoActualAngles, panServo, tiltServo]);

    const handleTouch = useCallback(
        (
            event:
                | React.MouseEvent<HTMLDivElement>
                | React.TouchEvent<HTMLDivElement>
        ) => {
            if (!panServo || !tiltServo) {
                return;
            }
            const isTouch = isTouchEvent(event);
            const clientX = isTouch ? event.touches[0].clientX : event.clientX;
            const clientY = isTouch ? event.touches[0].clientY : event.clientY;

            const rect = event.currentTarget.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const [panAngle, tiltAngle] = mapXYToPanTilt(
                x,
                y,
                panServo,
                tiltServo,
                TOUCH_GRID_SIZE
            );
            console.log({ x, y, panAngle, tiltAngle });
            sendHubStateUpdate({
                servo_angles: { pan: panAngle, tilt: tiltAngle },
            });
        },
        [panServo, tiltServo]
    );

    if (!servoConfig) {
        return null;
    }
    if (!panServo || !tiltServo) {
        console.error(
            "Servo named 'pan' or 'tilt' not found in servo config",
            servoConfig
        );
        return null;
    }

    return (
        <div className={st.outerContainer}>
            <h4>Pan</h4>
            <div className={st.servoRange}>
                <div>{panServo.max_angle}&deg;</div>
                <div className={st.spacer} />
                <div>{panServo.min_angle}&deg;</div>
            </div>
            <div className={st.innerContainer}>
                <div className={st.tiltLabelsContainer}>
                    <h4>Tilt</h4>
                    <div className={st.servoRange}>
                        <div>{tiltServo.max_angle}&deg;</div>
                        <div className={st.spacer} />
                        <div>{tiltServo.min_angle}&deg;</div>
                    </div>
                </div>
                <div
                    className={st.touchGrid}
                    onClick={handleTouch}
                    onTouchEnd={handleTouch}
                >
                    <div
                        className={st.angleXY}
                        style={{ top: `${angleY}px`, left: `${angleX}px` }}
                    />
                    <div
                        className={st.angleActualXY}
                        style={{
                            top: `${angleActualY}px`,
                            left: `${angleActualX}px`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
