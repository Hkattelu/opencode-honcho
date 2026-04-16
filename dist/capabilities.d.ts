export declare const HOST_CAPABILITIES: {
    readonly hard_command_interception: "unsupported";
    readonly pre_model_command_execute: "supported";
    readonly structured_question_ui: "unsupported";
    readonly persistent_background_runtime: "unsupported";
};
export declare const HOST_CAPABILITIES_VERSION = "1";
export type HostCapabilityStatus = (typeof HOST_CAPABILITIES)[keyof typeof HOST_CAPABILITIES];
