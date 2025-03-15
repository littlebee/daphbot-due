import { videoHost } from "../util/hubState";

import st from "./VideoItem.module.css";

interface VideoItemProps {
    key: string;
    baseFileName: string;
    onClick: (baseFileName: string) => void;
}

export const VideoItem: React.FC<VideoItemProps> = ({
    key,
    baseFileName,
    onClick,
}) => {
    const url = `http://${videoHost}/recorded_video/${baseFileName}.jpg`;

    return (
        <div
            className={st.listItem}
            key={key}
            onClick={() => onClick(baseFileName)}
        >
            <img className={st.thumbnail} src={url} alt="video thumbnail" />

            {baseFileName}
        </div>
    );
};
