import { v4 as uuidv4 } from "uuid";

import { IRecognizedObject } from "../util/hubState";

import st from "./ObjectsOverlay.module.css";

export interface ObjectsOverlayProps {
    recogObjects?: IRecognizedObject[];
}

export function ObjectsOverlay({ recogObjects }: ObjectsOverlayProps) {
    if (!recogObjects || recogObjects.length < 1) {
        return null;
    }
    const elements = [];
    for (const obj of recogObjects) {
        const [left, top, right, bottom] = obj.bounding_box;

        const style = {
            top,
            left,
            height: bottom - top,
            width: right - left,
        };
        // Use a uuid key here because we don't have a good way of uniquely identifying
        // these and having diff objects with the same key causes React to leave ghost
        // recog objects that wont go away until you turn off the overlay
        elements.push(
            <div className={st.objectSquare} style={style} key={uuidv4()}>
                <div className={st.objectClassification}>
                    {obj.classification}
                </div>
                <div className={st.objectConfidence}>
                    {obj.confidence.toFixed(3)}
                </div>
            </div>
        );
    }
    return <div className={st.wrapper}>{elements}</div>;
}
