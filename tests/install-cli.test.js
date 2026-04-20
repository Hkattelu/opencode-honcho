import { expect, test } from "bun:test"
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import os from "node:os"

import { __testing } from "../dist/index.js"

test("installGlobalConfig writes plugin and Honcho commands into global opencode.json", async () => {
  const configDir = await mkdtemp(path.join(os.tmpdir(), "opencode-install-"))

  const result = await __testing.installGlobalConfig({
    configDir,
    pluginSpec: "@honcho-ai/opencode-honcho",
  })

  const config = JSON.parse(await readFile(path.join(configDir, "opencode.json"), "utf-8"))
  expect(result.opencodeConfigPath).toBe(path.join(configDir, "opencode.json"))
  expect(config.$schema).toBe("https://opencode.ai/config.json")
  expect(config.plugin).toEqual(["@honcho-ai/opencode-honcho"])
  expect(config.command["honcho:setup"]).toBeTruthy()
  expect(config.command["honcho:status"]).toBeTruthy()
  expect(config.command["honcho:settings"]).toBeTruthy()
  expect(config.command["honcho:set"]).toBeTruthy()
  expect(config.command["honcho:unset"]).toBeTruthy()
  expect(config.command["honcho:mode"]).toBeTruthy()
  expect(config.command["honcho:write"]).toBeTruthy()
  expect(config.command["honcho:interview"]).toBeTruthy()
  expect(config.command["honcho:write"].description).toMatch(/write frequency|write policy/i)
  expect(config.command["honcho:write"].template).toMatch(/does not create memory/i)
  expect(config.command["honcho:interview"].description).toMatch(/durable memory/i)
  expect(config.command["honcho:interview"].template).toMatch(/honcho_create_conclusion/)
})

test("installGlobalConfig preserves existing config and avoids duplicate plugin specs", async () => {
  const configDir = await mkdtemp(path.join(os.tmpdir(), "opencode-install-existing-"))
  await mkdir(configDir, { recursive: true })
  await writeFile(
    path.join(configDir, "opencode.json"),
    JSON.stringify(
      {
        plugin: ["@honcho-ai/opencode-honcho"],
        command: {
          existing: {
            description: "keep me",
            template: "echo existing",
          },
        },
      },
      null,
      2,
    ),
  )

  await __testing.installGlobalConfig({
    configDir,
    pluginSpec: "@honcho-ai/opencode-honcho",
  })

  const config = JSON.parse(await readFile(path.join(configDir, "opencode.json"), "utf-8"))
  expect(config.plugin).toEqual(["@honcho-ai/opencode-honcho"])
  expect(config.command.existing.description).toBe("keep me")
  expect(config.command["honcho:setup"]).toBeTruthy()
})
