/**
 * Typed hook for accessing daphbot-specific hub state.
 * Wraps the base useHubState hook with proper typing for daphbot extensions.
 */

import { useHubState } from "basic_bot_react";
import { IDaphbotHubState } from "../types/daphbotHubState";

/**
 * Hook to access the daphbot hub state with proper typing.
 * Eliminates prop drilling by accessing state directly from HubStateProvider context.
 *
 * @returns IDaphbotHubState - The current daphbot hub state
 */
export const useDaphbotHubState = (): IDaphbotHubState => {
    return useHubState() as IDaphbotHubState;
};
