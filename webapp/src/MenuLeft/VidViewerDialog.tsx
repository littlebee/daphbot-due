import { useEffect, useState, useMemo } from "react";
import { videoHost } from "../util/hubState";

import st from "./VidViewerDialog.module.css";
import { VideoItem } from "./VideoItem";

const PAGE_SIZE = 10;

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
    const [pages, setPages] = useState<number>(1);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        fetch(`http://${videoHost}/recorded_video`)
            .then((res) => res.json())
            .then((data) => setFileNames(data));
    }, [isOpen]);

    const listItems = useMemo(() => {
        const items = [];
        for (let i = 0; i < fileNames.length && i < pages * PAGE_SIZE; i++) {
            items.push(
                <VideoItem
                    key={fileNames[i]}
                    baseFileName={fileNames[i]}
                    onClick={setSelectedVideo}
                />
            );
        }
        return items;
    }, [fileNames, pages]);

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
                        <>{listItems}</>
                        {fileNames.length > pages * PAGE_SIZE && (
                            <button
                                className={st.loadMoreButton}
                                onClick={() => setPages(pages + 1)}
                            >
                                Load More
                            </button>
                        )}
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
