import type { TuiPluginModule } from "@opencode-ai/plugin/tui";
type GlobalSettings = {
    apiKey?: string;
    peerName?: string;
    hosts?: {
        opencode?: {
            enabled?: boolean;
            baseUrl?: string;
            workspace?: string;
            aiPeer?: string;
            globalOverride?: boolean;
            recallMode?: "hybrid" | "context" | "tools";
            observation?: "directional" | "unified";
            peerModel?: "classic" | "hierarchical";
            writeFrequency?: "async" | "turn" | "session" | number;
            sessionStrategy?: "per-repo" | "per-directory" | "per-session" | "global" | "git-branch" | "chat-instance";
            dialecticReasoningLevel?: "minimal" | "low" | "medium" | "high" | "max";
            dialecticDynamic?: boolean;
            dialecticMaxChars?: number;
            messageMaxChars?: number;
            saveMessages?: boolean;
        };
    };
};
declare const plugin: TuiPluginModule & {
    id: string;
};
export declare const __testing: {
    normalizeSettings: (settings: GlobalSettings) => {
        baseUrl: string;
        apiKey: string;
    };
    statusMessage: (settings: GlobalSettings) => string;
    validateCloudApiKey: (value: string) => "Honcho Cloud requires a Honcho API key. Enter a non-empty key or choose Self-hosted / local." | null;
};
export default plugin;
