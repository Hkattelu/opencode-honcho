import test from "node:test"
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises"

import tuiModule, { __testing } from "../dist/tui.js"

test("tui exports testing helpers for cloud api key validation", () => {
  assert.equal(tuiModule.id, "@honcho-ai/opencode-honcho")
  assert.match(__testing.validateCloudApiKey(""), /requires a Honcho API key/i)
  assert.equal(__testing.validateCloudApiKey("hch-test-key"), null)
})

test("status message still reports cloud mode without a key as not configured", () => {
  const message = __testing.statusMessage({
    apiKey: "",
    baseUrl: "https://api.honcho.dev",
  })

  assert.match(message, /Configured: no/)
  assert.match(message, /Run \/honcho:setup to finish configuration\./)
})

test("status message reads the root baseUrl", () => {
  const message = __testing.statusMessage({
    apiKey: "key",
    baseUrl: "http://127.0.0.1:8000",
  })

  assert.match(message, /Configured: yes/)
  assert.match(message, /Deployment: Local \/ self-hosted/)
  assert.match(message, /Base URL: http:\/\/127.0.0.1:8000/)
})

test("settings message shows config values separately from status messaging", () => {
  const message = __testing.settingsMessage({
    apiKey: "key",
    peerName: "user-name",
    baseUrl: "https://api.honcho.dev",
    hosts: {
      opencode: {
        workspace: "opencode",
        aiPeer: "opencode",
        recallMode: "hybrid",
        observationMode: "directional",
        sessionStrategy: "per-directory",
      },
    },
  })

  assert.match(message, /Config path:/)
  assert.match(message, /Peer name: user-name/)
  assert.match(message, /Observation mode: directional/)
})

test("status and settings messages are distinct surfaces", () => {
  const settings = {
    apiKey: "key",
    peerName: "user-name",
    baseUrl: "https://api.honcho.dev",
    hosts: {
      opencode: {
        workspace: "opencode",
        aiPeer: "opencode",
        recallMode: "hybrid",
        observationMode: "directional",
        sessionStrategy: "per-directory",
      },
    },
  }

  expect(__testing.statusMessage(settings)).not.toBe(__testing.settingsMessage(settings))
})

test("native TUI Honcho commands do not register slash aliases", () => {
  const commands = __testing.buildCommands({})
  assert.deepEqual(
    commands.map((command) => command.value),
    ["honcho.setup", "honcho.status", "honcho.settings"],
  )
  assert.equal(commands.every((command) => command.slash === undefined), true)
})

test("native TUI commands do not register slash aliases", () => {
  const commands = __testing.buildCommands({})

  expect(commands.map((command) => command.value)).toEqual([
    "honcho.setup",
    "honcho.status",
    "honcho.settings",
  ])
  expect(commands.every((command) => command.slash === undefined)).toBe(true)
})

test("tui saveSettings persists only the final supported root and host fields", async () => {
  const homeDir = await mkdtemp(path.join(os.tmpdir(), "honcho-tui-clean-fields-"))
  const sharedConfigDir = path.join(homeDir, ".honcho")
  const sharedConfigPath = path.join(sharedConfigDir, "config.json")
  const previousHome = process.env.HOME

  await mkdir(sharedConfigDir, { recursive: true })
  await writeFile(sharedConfigPath, JSON.stringify({}, null, 2))
  process.env.HOME = homeDir

  try {
    await __testing.saveSettings({
      apiKey: "key",
      baseUrl: "https://api.honcho.dev",
      hosts: {
        opencode: {
          workspace: "opencode",
          aiPeer: "opencode",
          recallMode: "hybrid",
          observationMode: "directional",
          sessionStrategy: "per-directory",
          writeFrequency: "session",
          peerModel: "hierarchical",
          baseUrl: "http://127.0.0.1:8000",
        },
      },
    })

    const persisted = JSON.parse(await readFile(sharedConfigPath, "utf-8"))
    assert.equal(persisted.apiKey, "key")
    assert.equal(persisted.baseUrl, "https://api.honcho.dev")
    assert.equal(persisted.peerName, "user")
    assert.equal("enabled" in persisted, false)
    assert.equal("workspace" in persisted, false)
    assert.equal("aiPeer" in persisted, false)
    assert.equal("globalOverride" in persisted, false)
    assert.equal("peerModel" in persisted, false)
    assert.equal("writeFrequency" in persisted, false)
    assert.equal(persisted.hosts.opencode.workspace, "opencode")
    assert.equal(persisted.hosts.opencode.aiPeer, "opencode")
    assert.equal(persisted.hosts.opencode.recallMode, "hybrid")
    assert.equal(persisted.hosts.opencode.observationMode, "directional")
    assert.equal(persisted.hosts.opencode.sessionStrategy, "per-directory")
    assert.equal("baseUrl" in persisted.hosts.opencode, false)
    assert.equal("enabled" in persisted.hosts.opencode, false)
    assert.equal("peerModel" in persisted.hosts.opencode, false)
    assert.equal("writeFrequency" in persisted.hosts.opencode, false)
  } finally {
    if (previousHome === undefined) delete process.env.HOME
    else process.env.HOME = previousHome
  }
})
