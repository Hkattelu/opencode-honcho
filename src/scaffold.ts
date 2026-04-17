import { mkdir, writeFile, readFile } from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"

export const DEFAULT_PACKAGE_NAME = "@honcho-ai/opencode-honcho"

type InstallConfigOptions = {
  configDir?: string
  pluginSpec?: string
}

type InstallConfigResult = {
  configDir: string
  opencodeConfigPath: string
  commandNames: string[]
  pluginSpec: string
}

const opencodeCommands = () => ({
  "honcho:setup": {
    description: "Validate Honcho connectivity and repair OpenCode config.",
    template:
      "Shared Honcho config lives at `~/.honcho/config.json`, and OpenCode settings live under `hosts.opencode`. If the first command argument looks like an Honcho API key, pass it to `honcho_setup` as `apiKey` so it persists globally for all projects. Do not call `honcho_get_config` for setup. Immediately call `honcho_setup` exactly once and summarize the effective OpenCode Honcho status.",
  },
  "honcho:status": {
    description: "Show Honcho runtime health and current OpenCode memory state.",
    template:
      "Immediately call `honcho_status` exactly once. If the user asks for raw output, return the exact JSON and nothing else.",
  },
  "honcho:settings": {
    description: "Inspect persisted Honcho project settings for OpenCode.",
    template:
      "Persisted project settings live in `.opencode/honcho.json`, and shared Honcho config lives at `~/.honcho/config.json` under `hosts.opencode`. Immediately call `honcho_get_config` and summarize the effective values.",
  },
  "honcho:set": {
    description: "Persist a single Honcho setting for all future OpenCode sessions in this project.",
    template: "Update `.opencode/honcho.json` by calling `honcho_set_config` exactly once with the requested field and value.",
  },
  "honcho:unset": {
    description: "Reset a persisted Honcho setting back to its default value for this project.",
    template: "Reset the requested key to its documented default via `honcho_set_config`.",
  },
  "honcho:mode": {
    description: "Change the OpenCode Honcho recall mode.",
    template: "Call `honcho_set_config` with field `recallMode` and the requested value.",
  },
  "honcho:write": {
    description: "Change the OpenCode Honcho write frequency or write policy. This command does not create memory.",
    template:
      "Call `honcho_set_config` with field `writeFrequency` and the requested value. This command only updates the write policy and does not create memory.",
  },
  "honcho:interview": {
    description: "Capture durable memory into Honcho.",
    template:
      "Ask concise durable-memory questions, or if direct text is provided call `honcho_create_conclusion` exactly once with that exact remaining argument text verbatim.",
  },
})

const globalConfigDir = () =>
  path.join(process.env.XDG_CONFIG_HOME || path.join(homedir(), ".config"), "opencode")

const readJsonFile = async (filePath: string) => {
  try {
    return JSON.parse(await readFile(filePath, "utf-8")) as Record<string, unknown>
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {}
    }
    throw error
  }
}

const normalizePluginList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string | [string, Record<string, unknown>] =>
          typeof entry === "string" ||
          (Array.isArray(entry) &&
            entry.length >= 1 &&
            typeof entry[0] === "string" &&
            (entry.length === 1 || typeof entry[1] === "object" || entry[1] === undefined)),
      )
    : []

const ensurePluginSpec = (
  plugins: Array<string | [string, Record<string, unknown>]>,
  pluginSpec: string,
) => {
  const packageName = pluginSpec.replace(/@[^/]+$/, "")
  if (
    plugins.some((entry) => {
      const spec = typeof entry === "string" ? entry : entry[0]
      return spec === pluginSpec || spec === packageName || spec.replace(/@[^/]+$/, "") === packageName
    })
  ) {
    return plugins
  }
  return [...plugins, pluginSpec]
}

export const installGlobalConfig = async ({
  configDir = globalConfigDir(),
  pluginSpec = DEFAULT_PACKAGE_NAME,
}: InstallConfigOptions = {}): Promise<InstallConfigResult> => {
  const absoluteConfigDir = path.resolve(configDir)
  const opencodeConfigPath = path.join(absoluteConfigDir, "opencode.json")
  const current = await readJsonFile(opencodeConfigPath)
  const next: Record<string, unknown> = {
    ...current,
    $schema: typeof current.$schema === "string" ? current.$schema : "https://opencode.ai/config.json",
    plugin: ensurePluginSpec(normalizePluginList(current.plugin), pluginSpec),
    command: {
      ...(typeof current.command === "object" && current.command ? (current.command as Record<string, unknown>) : {}),
      ...opencodeCommands(),
    },
  }

  await mkdir(absoluteConfigDir, { recursive: true })
  await writeFile(opencodeConfigPath, `${JSON.stringify(next, null, 2)}\n`, "utf-8")

  return {
    configDir: absoluteConfigDir,
    opencodeConfigPath,
    commandNames: Object.keys(opencodeCommands()),
    pluginSpec,
  }
}

export const scaffoldTemplates = {
  DEFAULT_PACKAGE_NAME,
  globalConfigDir,
  installGlobalConfig,
  opencodeCommands,
}
