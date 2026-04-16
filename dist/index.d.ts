import { type Plugin } from "@opencode-ai/plugin";
type HonchoSdkModule = typeof import("../vendor/honcho-sdk/dist/index.js");
type HonchoSdkLoaderDeps = {
    requireImpl?: (specifier: string) => unknown;
    importImpl?: (specifier: string) => Promise<unknown>;
};
type RecallMode = "hybrid" | "context" | "tools";
type ObservationMode = "directional" | "unified";
type SessionStrategy = "per-repo" | "per-directory" | "per-session" | "global" | "git-branch" | "chat-instance";
type PeerModel = "classic" | "hierarchical";
type DialecticReasoningLevel = "minimal" | "low" | "medium" | "high" | "max";
type WriteFrequency = "async" | "turn" | "session" | number;
type ContextRefreshSettings = {
    messageThreshold: number;
    ttlSeconds: number;
    skipTrivialPrompts: boolean;
    useSessionStartDialectic: boolean;
};
export type RuntimePluginOptions = {
    configPath?: string;
};
type HonchoSettings = {
    enabled: boolean;
    apiKey: string;
    baseUrl: string;
    peerName: string;
    aiPeer: string;
    workspace: string;
    globalOverride: boolean;
    linkedHosts: string[];
    recallMode: RecallMode;
    observation: ObservationMode;
    peerModel: PeerModel;
    writeFrequency: WriteFrequency;
    sessionStrategy: SessionStrategy;
    dialecticReasoningLevel: DialecticReasoningLevel;
    dialecticDynamic: boolean;
    dialecticMaxChars: number;
    messageMaxChars: number;
    saveMessages: boolean;
    contextRefresh: ContextRefreshSettings;
};
type RuntimeHandle = {
    rootDir: string;
    configPath: string;
    globalConfigPath: string;
    config: HonchoSettings;
    workspaceId: string;
    sessionId: string;
    sessionKey: string;
    userPeerId: string;
    rootAgentPeerId: string;
    activeAgentPeerId: string;
    childAgentPeerId: string | null;
    parentAgentObserverPeerId: string | null;
};
type PeerDescription = {
    id: string;
    observeMe: boolean;
    observeOthers: boolean;
    sessionScoped?: boolean;
    modelsOnly?: string[];
};
type PeerTopology = {
    sessionPeerConfigs: Record<string, {
        observeMe: boolean;
        observeOthers: boolean;
    }>;
    describedPeers: {
        userPeer: PeerDescription;
        rootAgentPeer: PeerDescription;
        childAgentPeer: PeerDescription | null;
        parentAgentObserverPeer: PeerDescription | null;
    };
};
export declare const createHonchoRuntimePlugin: ({ configPath }?: RuntimePluginOptions) => Plugin;
export declare const HonchoRuntimePlugin: Plugin;
export declare const __testing: {
    extractCompletedAssistantMessage: (payload: unknown, state: Map<string, {
        sessionID: string;
        parts: Map<string, string>;
    }>) => {
        messageId: string;
        sessionID: string;
        text: string;
        createdAt: string;
    } | null;
    honchoSdkImportPath: string;
    buildPeerTopology: (handle: Pick<RuntimeHandle, "config" | "userPeerId" | "rootAgentPeerId" | "activeAgentPeerId" | "childAgentPeerId" | "parentAgentObserverPeerId">) => PeerTopology;
    defaultSettings: HonchoSettings;
    deriveSessionScope: ({ workspaceId, sessionStrategy, rootDir, repoName, currentDirectory, sessionId, }: {
        workspaceId: string;
        sessionStrategy: SessionStrategy;
        rootDir: string;
        repoName: string;
        currentDirectory: string;
        sessionId: string;
    }) => Promise<string>;
    timestampToIso: (value: unknown) => string | undefined;
    upsertAssistantMessagePart: (state: Map<string, {
        sessionID: string;
        parts: Map<string, string>;
    }>, payload: unknown) => void;
    extractSessionId: (input: Record<string, unknown> | undefined) => string;
    installGlobalConfig: ({ configDir, pluginSpec, }?: {
        configDir?: string;
        pluginSpec?: string;
    }) => Promise<{
        configDir: string;
        opencodeConfigPath: string;
        commandNames: string[];
        pluginSpec: string;
    }>;
    loadHonchoCtorForTest: () => Promise<typeof import("../vendor/honcho-sdk/dist/client.js").Honcho>;
    loadHonchoModuleForTest: (deps?: HonchoSdkLoaderDeps) => Promise<unknown>;
    normalizeId: (value: string) => string;
    resolveHonchoCtor: (sdk: unknown) => HonchoSdkModule["Honcho"];
    sessionPeerAdditions: (topology: PeerTopology) => (readonly [string, {
        observeMe: boolean;
        observeOthers: boolean;
    }])[];
    scaffoldTemplates: {
        DEFAULT_PACKAGE_NAME: string;
        globalConfigDir: () => string;
        installGlobalConfig: ({ configDir, pluginSpec, }?: {
            configDir?: string;
            pluginSpec?: string;
        }) => Promise<{
            configDir: string;
            opencodeConfigPath: string;
            commandNames: string[];
            pluginSpec: string;
        }>;
        opencodeCommands: () => {
            "honcho:setup": {
                description: string;
                template: string;
            };
            "honcho:status": {
                description: string;
                template: string;
            };
            "honcho:settings": {
                description: string;
                template: string;
            };
            "honcho:set": {
                description: string;
                template: string;
            };
            "honcho:unset": {
                description: string;
                template: string;
            };
            "honcho:mode": {
                description: string;
                template: string;
            };
            "honcho:write": {
                description: string;
                template: string;
            };
            "honcho:interview": {
                description: string;
                template: string;
            };
        };
    };
};
export default HonchoRuntimePlugin;
