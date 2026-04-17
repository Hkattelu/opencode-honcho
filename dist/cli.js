#!/usr/bin/env node

// src/cli.ts
import path2 from "node:path";
import { spawn } from "node:child_process";

// src/scaffold.ts
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
var DEFAULT_PACKAGE_NAME = "@honcho-ai/opencode-honcho";
var opencodeCommands = () => ({
  "honcho:setup": {
    description: "Validate Honcho connectivity and repair OpenCode config.",
    template: "Shared Honcho config lives at `~/.honcho/config.json`, and OpenCode settings live under `hosts.opencode`. If the first command argument looks like an Honcho API key, pass it to `honcho_setup` as `apiKey` so it persists globally for all projects. Do not call `honcho_get_config` for setup. Immediately call `honcho_setup` exactly once and summarize the effective OpenCode Honcho status."
  },
  "honcho:status": {
    description: "Show Honcho runtime health and current OpenCode memory state.",
    template: "Immediately call `honcho_status` exactly once. If the user asks for raw output, return the exact JSON and nothing else."
  },
  "honcho:settings": {
    description: "Inspect persisted Honcho project settings for OpenCode.",
    template: "Persisted project settings live in `.opencode/honcho.json`, and shared Honcho config lives at `~/.honcho/config.json` under `hosts.opencode`. Immediately call `honcho_get_config` and summarize the effective values."
  },
  "honcho:set": {
    description: "Persist a single Honcho setting for all future OpenCode sessions in this project.",
    template: "Update `.opencode/honcho.json` by calling `honcho_set_config` exactly once with the requested field and value."
  },
  "honcho:unset": {
    description: "Reset a persisted Honcho setting back to its default value for this project.",
    template: "Reset the requested key to its documented default via `honcho_set_config`."
  },
  "honcho:mode": {
    description: "Change the OpenCode Honcho recall mode.",
    template: "Call `honcho_set_config` with field `recallMode` and the requested value."
  },
  "honcho:write": {
    description: "Change the OpenCode Honcho write frequency or write policy. This command does not create memory.",
    template: "Call `honcho_set_config` with field `writeFrequency` and the requested value. This command only updates the write policy and does not create memory."
  },
  "honcho:interview": {
    description: "Capture durable memory into Honcho.",
    template: "Ask concise durable-memory questions, or if direct text is provided call `honcho_create_conclusion` exactly once with that exact remaining argument text verbatim."
  }
});
var globalConfigDir = () => path.join(process.env.XDG_CONFIG_HOME || path.join(homedir(), ".config"), "opencode");
var readJsonFile = async (filePath) => {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
};
var normalizePluginList = (value) => Array.isArray(value) ? value.filter((entry) => typeof entry === "string" || Array.isArray(entry) && entry.length >= 1 && typeof entry[0] === "string" && (entry.length === 1 || typeof entry[1] === "object" || entry[1] === undefined)) : [];
var ensurePluginSpec = (plugins, pluginSpec) => {
  const packageName = pluginSpec.replace(/@[^/]+$/, "");
  if (plugins.some((entry) => {
    const spec = typeof entry === "string" ? entry : entry[0];
    return spec === pluginSpec || spec === packageName || spec.replace(/@[^/]+$/, "") === packageName;
  })) {
    return plugins;
  }
  return [...plugins, pluginSpec];
};
var installGlobalConfig = async ({
  configDir = globalConfigDir(),
  pluginSpec = DEFAULT_PACKAGE_NAME
} = {}) => {
  const absoluteConfigDir = path.resolve(configDir);
  const opencodeConfigPath = path.join(absoluteConfigDir, "opencode.json");
  const current = await readJsonFile(opencodeConfigPath);
  const next = {
    ...current,
    $schema: typeof current.$schema === "string" ? current.$schema : "https://opencode.ai/config.json",
    plugin: ensurePluginSpec(normalizePluginList(current.plugin), pluginSpec),
    command: {
      ...typeof current.command === "object" && current.command ? current.command : {},
      ...opencodeCommands()
    }
  };
  await mkdir(absoluteConfigDir, { recursive: true });
  await writeFile(opencodeConfigPath, `${JSON.stringify(next, null, 2)}
`, "utf-8");
  return {
    configDir: absoluteConfigDir,
    opencodeConfigPath,
    commandNames: Object.keys(opencodeCommands()),
    pluginSpec
  };
};

// src/cli.ts
var usage = () => `Usage:
  opencode-honcho install [--plugin-spec <spec>] [--config-dir <dir>] [--force]

Examples:
  npx @honcho-ai/opencode-honcho install
`;
var runCommand = (command, args, env) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...env
    }
  });
  child.on("error", reject);
  child.on("exit", (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
  });
});
var preferredShellRcFile = () => {
  const shell = path2.basename(process.env.SHELL || "");
  if (shell === "zsh")
    return "~/.zshrc";
  if (shell === "bash")
    return "~/.bashrc";
  return "your shell rc file";
};
var installPathRecoveryMessage = () => [
  "OpenCode CLI was not found on PATH.",
  "Install OpenCode first, then restart your shell or source your shell config before running this installer again.",
  `For example: source ${preferredShellRcFile()}`
].join(" ");
var parseInstallArgs = (argv) => {
  let force = false;
  let pluginSpec = DEFAULT_PACKAGE_NAME;
  let configDir;
  for (let index = 0;index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--plugin-spec") {
      pluginSpec = argv[index + 1] || pluginSpec;
      index += 1;
      continue;
    }
    if (arg === "--config-dir") {
      configDir = argv[index + 1] ? path2.resolve(argv[index + 1]) : configDir;
      index += 1;
      continue;
    }
    if (arg === "--force") {
      force = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return { force, pluginSpec, configDir };
};
var main = async () => {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }
  if (command === "install") {
    const options = parseInstallArgs(rest);
    const env = options.configDir ? { OPENCODE_CONFIG_DIR: options.configDir } : undefined;
    try {
      await runCommand("opencode", ["plugin", options.pluginSpec, "--global", ...options.force ? ["--force"] : []], env);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(installPathRecoveryMessage());
      }
      if (error instanceof Error && /spawn opencode ENOENT/i.test(error.message)) {
        throw new Error(installPathRecoveryMessage());
      }
      throw error;
    }
    const config = await installGlobalConfig({
      configDir: options.configDir,
      pluginSpec: options.pluginSpec
    });
    console.log(JSON.stringify({
      ok: true,
      command: "install",
      pluginSpec: options.pluginSpec,
      configDir: config.configDir,
      opencodeConfigPath: config.opencodeConfigPath,
      installedCommands: config.commandNames,
      nextSteps: [
        "Start OpenCode and run /honcho:setup for cloud setup or choose Self-hosted / local for a local Honcho instance.",
        "Run /honcho:status to verify the runtime."
      ]
    }, null, 2));
    return;
  }
  throw new Error(`Unknown command: ${command}`);
};
main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
