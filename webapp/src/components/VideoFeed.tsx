import { useState } from "react";

import { videoHost } from "../util/hubState";

import st from "./VideoFeed.module.css";

export function VideoFeed() {
    const [rand] = useState<number>(0);
    const [errorMsg, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // TODO : this is a hack to force the video feed to reload every 30 seconds, but
    //   is it necessary?  I forget what problem this was solving - maybe caching
    //   issue?  If so, we should fix the caching issue instead of doing this.
    // useEffect(() => {
    //     setInterval(() => {
    //         setRand(Math.random());
    //     }, 30000);
    // }, []);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(true);
        console.error("got error from image load", e);
        setErrorMessage(`Unable to get video feed from ${videoHost}`);
    };

    const handleLoad = () => {
        console.log("video feed loaded");
        setErrorMessage(null);
        setIsLoading(false);
    };

    const feedUrl = `http://${videoHost}/video_feed?rand=${rand}`;

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
