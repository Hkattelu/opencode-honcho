#!/usr/bin/env node

import path from "node:path"
import { spawn } from "node:child_process"

import { DEFAULT_PACKAGE_NAME, installGlobalConfig } from "./scaffold.js"

const usage = () => `Usage:
  opencode-honcho install [--plugin-spec <spec>] [--config-dir <dir>] [--force]

Examples:
  npx @honcho-ai/opencode-honcho install
`

const runCommand = (command: string, args: string[], env?: NodeJS.ProcessEnv) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: {
        ...process.env,
        ...env,
      },
    })

    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`))
    })
  })

const preferredShellRcFile = () => {
  const shell = path.basename(process.env.SHELL || "")
  if (shell === "zsh") return "~/.zshrc"
  if (shell === "bash") return "~/.bashrc"
  return "your shell rc file"
}

const installPathRecoveryMessage = () =>
  [
    "OpenCode CLI was not found on PATH.",
    "Install OpenCode first, then restart your shell or source your shell config before running this installer again.",
    `For example: source ${preferredShellRcFile()}`,
  ].join(" ")

const parseInstallArgs = (argv: string[]) => {
  let force = false
  let pluginSpec = DEFAULT_PACKAGE_NAME
  let configDir: string | undefined

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--plugin-spec") {
      pluginSpec = argv[index + 1] || pluginSpec
      index += 1
      continue
    }
    if (arg === "--config-dir") {
      configDir = argv[index + 1] ? path.resolve(argv[index + 1]) : configDir
      index += 1
      continue
    }
    if (arg === "--force") {
      force = true
      continue
    }
    if (arg === "--help" || arg === "-h") {
      console.log(usage())
      process.exit(0)
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  return { force, pluginSpec, configDir }
}

const main = async () => {
  const [command, ...rest] = process.argv.slice(2)
  if (!command || command === "--help" || command === "-h") {
    console.log(usage())
    return
  }

  if (command === "install") {
    const options = parseInstallArgs(rest)
    const env = options.configDir ? { OPENCODE_CONFIG_DIR: options.configDir } : undefined
    try {
      await runCommand("opencode", ["plugin", options.pluginSpec, "--global", ...(options.force ? ["--force"] : [])], env)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(installPathRecoveryMessage())
      }
      if (error instanceof Error && /spawn opencode ENOENT/i.test(error.message)) {
        throw new Error(installPathRecoveryMessage())
      }
      throw error
    }
    const config = await installGlobalConfig({
      configDir: options.configDir,
      pluginSpec: options.pluginSpec,
    })
    console.log(
      JSON.stringify(
        {
          ok: true,
          command: "install",
          pluginSpec: options.pluginSpec,
          configDir: config.configDir,
          opencodeConfigPath: config.opencodeConfigPath,
          installedCommands: config.commandNames,
          nextSteps: [
            "Start OpenCode and run /honcho:setup for cloud setup or choose Self-hosted / local for a local Honcho instance.",
            "Run /honcho:status to verify the runtime.",
          ],
        },
        null,
        2,
      ),
    )
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
