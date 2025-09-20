import { webSocket, logMessage } from "./hubState";
import { IHubState } from "./hubState";

export function sendHubStateUpdate(data: Partial<IHubState>) {
    logMessage("sending state update", { data, webSocket });
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(
            JSON.stringify({
                type: "updateState",
                data,
            })
        );
    } else {
        console.warn("WebSocket not ready, queuing state update:", data);
        // Queue the message to send once connected
        setTimeout(() => {
            if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                webSocket.send(
                    JSON.stringify({
                        type: "updateState",
                        data,
                    })
                );
            }
        }, 1000);
    }
}
