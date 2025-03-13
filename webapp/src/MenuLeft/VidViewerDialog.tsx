import { useEffect, useState } from "react";
import { videoHost } from "../util/hubState";

import st from "./VidViewerDialog.module.css";

interface VidViewerDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VidViewerDialog: React.FC<VidViewerDialogProps> = ({
    isOpen,
    onClose,
}) => {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [fileNames, setFileNames] = useState<Array<string>>([]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        fetch(`http://${videoHost}/recorded_video`)
            .then((res) => res.json())
            .then((data) => setFileNames(data));
    }, [isOpen]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={st.backdrop} onClick={handleBackdropClick}>
            <div className={st.dialog}>
                <h4 className={st.dialogTitle}>Recorded Videos</h4>
                <div className={st.dialogContent}>
                    <div className={st.listContainer}>
                        {fileNames.map((f) => (
                            <div
                                className={st.listItem}
                                key={f}
                                onClick={() => setSelectedVideo(f)}
                            >
                                <img
                                    className={st.thumbnail}
                                    src={`http://${videoHost}/recorded_video/${f}.jpg`}
                                    alt="video thumbnail"
                                />

                                {f}
                            </div>
                        ))}
                    </div>
                    <div className={st.videoContainer}>
                        {(selectedVideo && (
                            <video
                                controls
                                autoPlay
                                src={`http://${videoHost}/recorded_video/${selectedVideo}.mp4`}
                            />
                        )) || <div>Select a video to play</div>}
                    </div>
                </div>

                <button className={st.closeButton} onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};
