/**
 * Daphbot-specific extensions to the basic_bot hub state.
 * Extends the base IHubState with daphbot service-specific fields.
 */

import {
    IHubState,
    IRecognizedObject,
    DEFAULT_HUB_STATE,
} from "basic_bot_react";

/**
 * Behavior modes for the daphbot robot
 */
export enum BehaviorMode {
    Autonomous = "auto",
    Manual = "manual",
}

/**
 * Extended hub state interface for daphbot-due.
 * Adds daphbot-specific fields to the base IHubState.
 */
export interface IDaphbotHubState extends IHubState {
    /** Current primary target being tracked (provided by daphbot service) */
    primary_target?: IRecognizedObject | null;

    /** Current behavior mode (published by daphbot webapp, consumed by daphbot service) */
    daphbot_mode: BehaviorMode;
}

/**
 * Default initial state for daphbot hub connection
 */
export const DAPHBOT_DEFAULT_HUB_STATE: IDaphbotHubState = {
    ...DEFAULT_HUB_STATE,
    daphbot_mode: BehaviorMode.Autonomous,
};
