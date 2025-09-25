import { videoHost } from "./hubState";

export class WebRTCClient {
    private pc: RTCPeerConnection | null = null;
    private webrtcServerUrl = `http://${videoHost}/offer`;

    private negotiate() {
        if (!this.pc) return Promise.reject("PeerConnection not initialized");

        this.pc.addTransceiver("video", { direction: "recvonly" });
        this.pc.addTransceiver("audio", { direction: "recvonly" });
        return this.pc
            .createOffer()
            .then((offer) => {
                return this.pc && this.pc.setLocalDescription(offer);
            })
            .then(() => {
                // wait for ICE gathering to complete
                return new Promise((resolve) => {
                    if (this.pc && this.pc.iceGatheringState === "complete") {
                        resolve(void 0);
                    } else {
                        if (!this.pc) return;
                        const checkState = () => {
                            if (!this.pc) return;
                            if (this.pc.iceGatheringState === "complete") {
                                this.pc.removeEventListener(
                                    "icegatheringstatechange",
                                    checkState
                                );
                                resolve(void 0);
                            }
                        };
                        this.pc.addEventListener(
                            "icegatheringstatechange",
                            checkState
                        );
                    }
                });
            })
            .then(() => {
                if (!this.pc) return;
                const offer = this.pc.localDescription;
                if (!offer) {
                    console.error(
                        "webrtcClient: No local description available"
                    );
                    return;
                }
                return fetch(this.webrtcServerUrl, {
                    body: JSON.stringify({
                        sdp: offer.sdp,
                        type: offer.type,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                });
            })
            .then((response) => {
                if (!response || !response.ok) {
                    throw new Error(
                        `webrtcClient: Failed to get answer from server: ${
                            response ? response.statusText : "No response"
                        }`
                    );
                }
                return response && response.json();
            })
            .then((answer) => {
                if (!this.pc) {
                    console.error(
                        "webrtcClient: Got offer answer but PeerConnection not initialized"
                    );
                    return;
                }
                return this.pc.setRemoteDescription(answer);
            })
            .catch((e) => {
                alert(e);
            });
    }

    start(videoElement: HTMLVideoElement, audioElement: HTMLAudioElement) {
        this.pc = new RTCPeerConnection();

        // connect audio / video
        this.pc.addEventListener("track", (evt) => {
            if (evt.track.kind == "video") {
                videoElement.srcObject = evt.streams[0];
            } else if (evt.track.kind == "audio") {
                audioElement.srcObject = evt.streams[0];
            }
        });

        this.negotiate();
    }

    stop() {
        if (!this.pc) {
            console.debug("webrtcClient#stop(): PeerConnection already closed");
            return;
        }
        this.pc.close();
        this.pc = null;
    }
}
