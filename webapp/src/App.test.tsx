import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

import { CentralHubTestClient } from "../testHelpers/centralHub";

import App from "./App";

describe("App", () => {
    let hubClient: CentralHubTestClient;

    beforeAll(async () => {
        hubClient = new CentralHubTestClient("App.test.tsx");
        await hubClient.startTestHub();
    });

    afterAll(async () => {
        await hubClient.stopTestHub();
    });

    async function renderApp() {
        const hubPort = hubClient.getHubPort();
        console.log("App.test.tsx", { hubPort });
        // autoReconnect is set to false to prevent the app from throwing an error on teardown
        render(<App hubPort={hubPort} autoReconnect={false} />);
        await waitFor(() => screen.getByText(/online/i));
    }

    it("renders the App component", async () => {
        await renderApp();
        screen.getAllByText("D2");
        screen.getByText("Manual");
        screen.getByText("Autonomous");
    });

    it("can select behavior mode", async () => {
        await renderApp();
        const manualMode = screen.getByText("Manual");
        await act(async () => {
            manualMode.click();
            const nextMessage = await hubClient.waitForNextMessage();
            console.log("nextMessage", nextMessage);
            expect(nextMessage.data.daphbot_mode).toEqual("manual");
        });

        await waitFor(() => {
            expect(
                manualMode.classList.toString(),
                "manual mode should be selected after clicking manual mode"
            ).toContain("selected");
        });

        expect(
            screen.queryByTestId("pan-tilt"),
            "Pan/Tilt controls should be visible when in manual mode"
        ).toBeTruthy();

        const autonomousMode = screen.getByText("Autonomous");
        await waitFor(() => {
            expect(
                autonomousMode.classList.toString(),
                "autonomous mode should not be selected when manual mode is selected"
            ).not.toContain("selected");
        });

        await act(async () => {
            autonomousMode.click();
            const nextMessage = await hubClient.waitForNextMessage();
            console.log("nextMessage", nextMessage);
            expect(nextMessage.data.daphbot_mode).toEqual("auto");
        });
        await waitFor(() => {
            expect(
                manualMode.classList.toString(),
                "manual mode should not be selected after clicking autonomous mode"
            ).not.toContain("selected");
        });
        await waitFor(() => {
            expect(
                autonomousMode.classList.toString(),
                "autonomous mode should now be selected"
            ).toContain("selected");
        });
        expect(
            await screen.queryByTestId("pan-tilt"),
            "Pan/Tilt controls should not be visible when in autonomouse mode"
        ).toBeFalsy();
    });
});
