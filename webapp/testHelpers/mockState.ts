import { IHubState, BehaviorMode } from "../src/util/hubState";

export const mockState: IHubState = {
    hub_stats: {
        state_updates_recv: 1828904,
    },
    servo_config: {
        servos: [
            {
                name: "pan",
                channel: 15,
                motor_range: 180,
                min_angle: 0,
                max_angle: 180,
                min_pulse: 500,
                max_pulse: 2500,
            },
            {
                name: "tilt",
                channel: 14,
                motor_range: 180,
                min_angle: 10,
                max_angle: 140,
                min_pulse: 500,
                max_pulse: 2500,
            },
        ],
    },
    servo_actual_angles: {
        // set to center of range for each servo
        pan: 90,
        tilt: 10 + (140 - 10) / 2,
    },
    system_stats: {
        cpu_util: 85.7,
        cpu_temp: -1,
        ram_util: 21.4,
        hostname: "test-hostname",
    },
    primary_target: null,
    recognition: [],
    servo_angles: {
        pan: 150.437548828125,
        tilt: 82.85867614746094,
    },
    daphbot_mode: BehaviorMode.Manual,
};
