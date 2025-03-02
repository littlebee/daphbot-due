import { useState, useEffect } from "react";

import { hubHost } from "../util/hubState";

import st from "./VideoFeed.module.css";

const VIDEO_HOST = `${hubHost}:5801`;

export function VideoFeed() {
    const [rand, setRand] = useState<number>(0);
    const [errorMsg, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setInterval(() => {
            setRand(Math.random());
        }, 30000);
    }, []);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(true);
        console.error("got error from image load", e);
        setErrorMessage(`Unable to get video feed from ${VIDEO_HOST}`);
    };

    const handleLoad = () => {
        console.log("video feed loaded");
        setErrorMessage(null);
        setIsLoading(false);
    };

    const feedUrl = `http://${VIDEO_HOST}/video_feed?rand=${rand}`;

    // note must always render the img or it endlessly triggers onLoad
    const imgStyle = isLoading || errorMsg ? { display: "none" } : {};
    return (
        <div className={st.videoFeedContainer}>
            {(isLoading || errorMsg) && (
                <img
                    className="standby-image"
                    alt="please stand by"
                    src="/please-stand-by.png"
                />
            )}
            <img
                style={imgStyle}
                alt="video feed"
                src={feedUrl}
                onError={handleError}
                onLoad={handleLoad}
            />
        </div>
    );
}
