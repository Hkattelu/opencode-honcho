export declare const DEFAULT_PACKAGE_NAME = "@honcho-ai/opencode-honcho";
type InstallConfigOptions = {
    configDir?: string;
    pluginSpec?: string;
};
type InstallConfigResult = {
    configDir: string;
    opencodeConfigPath: string;
    commandNames: string[];
    pluginSpec: string;
};
export declare const installGlobalConfig: ({ configDir, pluginSpec, }?: InstallConfigOptions) => Promise<InstallConfigResult>;
export declare const scaffoldTemplates: {
    DEFAULT_PACKAGE_NAME: string;
    globalConfigDir: () => string;
    installGlobalConfig: ({ configDir, pluginSpec, }?: InstallConfigOptions) => Promise<InstallConfigResult>;
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
export {};
