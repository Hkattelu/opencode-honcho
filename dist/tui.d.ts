import type { TuiPluginModule } from "@opencode-ai/plugin/tui";
type GlobalSettings = {
    honchoApiKey?: string;
    apiKey?: string;
    baseUrl?: string;
    hosts?: {
        opencode?: {
            workspace?: string;
            aiPeer?: string;
            linkedHosts?: string[];
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
