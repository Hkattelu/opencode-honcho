import test from "node:test"
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"

import { createHonchoRuntimePlugin } from "../dist/index.js"

const withEnv = async (entries, action) => {
  const previous = new Map()
  for (const [key, value] of Object.entries(entries)) {
    previous.set(key, process.env[key])
    if (value === undefined) {
      delete process.env[key]
      continue
    }
    process.env[key] = value
  }

  try {
    return await action()
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key]
        continue
      }
      process.env[key] = value
    }
  }
}

const createPluginHarness = async (rootDir) => {
  const plugin = createHonchoRuntimePlugin()
  return plugin({
    client: {
      app: {
        log: async () => undefined,
      },
    },
    project: {
      id: "opencode",
      worktree: rootDir,
    },
    directory: rootDir,
    worktree: rootDir,
    serverUrl: new URL("http://127.0.0.1:4096"),
    $: {},
  })
}

const toolContext = (rootDir) => ({
  sessionID: "ses_test",
  messageID: "msg_test",
  agent: "build",
  directory: rootDir,
  worktree: rootDir,
  abort: new AbortController().signal,
  metadata() {},
  async ask() {},
})

test(
  "honcho_setup writes shared Honcho config with root peerName and hosts.opencode defaults",
  { concurrency: false },
  async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "honcho-setup-cloud-"))
    const homeDir = await mkdtemp(path.join(os.tmpdir(), "honcho-home-"))
    const sharedConfigDir = path.join(homeDir, ".honcho")
    const sharedConfigPath = path.join(sharedConfigDir, "config.json")

    await withEnv({ HOME: homeDir, USER: "adavya", XDG_CONFIG_HOME: undefined }, async () => {
      const hooks = await createPluginHarness(rootDir)
      const honchoSetup = hooks.tool.honcho_setup
      const result = JSON.parse(await honchoSetup.execute({ apiKey: "new-key" }, toolContext(rootDir)))
      const persisted = JSON.parse(await readFile(sharedConfigPath, "utf-8"))

      assert.equal(result.ok, true)
      assert.equal(result.globalConfigPath, sharedConfigPath)
      assert.equal(result.status.baseUrl, "https://api.honcho.dev")
      assert.equal(persisted.peerName, "adavya")
      assert.equal(persisted.apiKey, "new-key")
      assert.equal(persisted.honchoApiKey, undefined)
      assert.deepEqual(persisted.hosts.opencode, {
        enabled: true,
        baseUrl: "https://api.honcho.dev",
        aiPeer: "opencode",
        workspace: "opencode",
        globalOverride: false,
        recallMode: "hybrid",
        observation: "directional",
        peerModel: "classic",
        writeFrequency: "async",
        sessionStrategy: "per-directory",
        dialecticReasoningLevel: "low",
        dialecticDynamic: true,
        dialecticMaxChars: 600,
        messageMaxChars: 25000,
        saveMessages: true,
      })
      assert.equal("linkedHosts" in persisted.hosts.opencode, false)
      assert.equal(result.status.peers.userPeer.observe_me, true)
      assert.equal(result.status.peers.userPeer.observe_others, false)
      assert.equal(result.status.peers.userPeer.observeMe, undefined)
    })
  },
)

test(
  "honcho_status reads effective settings from shared hosts.opencode config",
  { concurrency: false },
  async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "honcho-status-honcho-api-key-"))
    const homeDir = await mkdtemp(path.join(os.tmpdir(), "honcho-home-status-"))
    const sharedConfigDir = path.join(homeDir, ".honcho")
    const sharedConfigPath = path.join(sharedConfigDir, "config.json")

    await mkdir(sharedConfigDir, { recursive: true })
    await writeFile(
      sharedConfigPath,
      JSON.stringify(
        {
          peerName: "adavya",
          apiKey: "status-key",
          hosts: {
            opencode: {
              baseUrl: "https://api.honcho.dev",
              aiPeer: "opencode",
              workspace: "opencode",
              observation: "directional",
            },
          },
        },
        null,
        2,
      ),
    )

    await withEnv({ HOME: homeDir, USER: "adavya", XDG_CONFIG_HOME: undefined }, async () => {
      const hooks = await createPluginHarness(rootDir)
      const result = JSON.parse(await hooks.tool.honcho_status.execute({}, toolContext(rootDir)))

      assert.equal(result.ok, true)
      assert.equal(result.configured, true)
      assert.equal(result.baseUrl, "https://api.honcho.dev")
      assert.equal(result.globalConfigPath, sharedConfigPath)
      assert.equal(result.workspace, "opencode")
      assert.equal(result.peers.userPeer.observe_me, true)
      assert.equal(result.peers.rootAgentPeer.observe_others, true)
      assert.equal(result.peers.rootAgentPeer.observeOthers, undefined)
    })
  },
)

test(
  "honcho_setup migrates legacy ~/.config/opencode/honcho.json into shared hosts.opencode",
  { concurrency: false },
  async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "honcho-setup-migrate-"))
    const homeDir = await mkdtemp(path.join(os.tmpdir(), "honcho-home-migrate-"))
    const legacyConfigDir = path.join(homeDir, ".config", "opencode")
    const legacyConfigPath = path.join(legacyConfigDir, "honcho.json")
    const sharedConfigPath = path.join(homeDir, ".honcho", "config.json")

    await mkdir(legacyConfigDir, { recursive: true })
    await writeFile(
      legacyConfigPath,
      JSON.stringify(
        {
          honchoApiKey: "legacy-key",
          baseUrl: "http://127.0.0.1:8010",
          aiPeer: "legacy-ai",
          workspace: "legacy-workspace",
          writeFrequency: "turn",
          linkedHosts: ["cursor"],
        },
        null,
        2,
      ),
    )

    await withEnv({ HOME: homeDir, USER: "adavya", XDG_CONFIG_HOME: undefined }, async () => {
      const hooks = await createPluginHarness(rootDir)
      const result = JSON.parse(await hooks.tool.honcho_status.execute({}, toolContext(rootDir)))
      const persisted = JSON.parse(await readFile(sharedConfigPath, "utf-8"))

      assert.equal(result.ok, true)
      assert.equal(result.configured, true)
      assert.equal(persisted.peerName, "adavya")
      assert.equal(persisted.apiKey, "legacy-key")
      assert.equal(persisted.honchoApiKey, undefined)
      assert.deepEqual(persisted.hosts.opencode, {
        enabled: true,
        baseUrl: "http://127.0.0.1:8010",
        aiPeer: "legacy-ai",
        workspace: "legacy-workspace",
        globalOverride: false,
        recallMode: "hybrid",
        observation: "directional",
        peerModel: "classic",
        writeFrequency: "turn",
        sessionStrategy: "per-directory",
        dialecticReasoningLevel: "low",
        dialecticDynamic: true,
        dialecticMaxChars: 600,
        messageMaxChars: 25000,
        saveMessages: true,
      })
      assert.equal("linkedHosts" in persisted.hosts.opencode, false)
    })
  },
)

test(
  "honcho_setup returns a structured error when the shared config path cannot be written",
  { concurrency: false },
  async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "honcho-setup-error-"))
    const homeDir = await mkdtemp(path.join(os.tmpdir(), "honcho-home-error-"))
    const invalidHonchoDir = path.join(homeDir, ".honcho")

    await writeFile(invalidHonchoDir, "not a directory\n")

    await withEnv({ HOME: homeDir, USER: "adavya", XDG_CONFIG_HOME: undefined }, async () => {
      const hooks = await createPluginHarness(rootDir)
      const honchoSetup = hooks.tool.honcho_setup
      const result = JSON.parse(await honchoSetup.execute({ apiKey: "new-key" }, toolContext(rootDir)))

      assert.equal(result.ok, false)
      assert.match(result.error, /persist|config|directory|ENOTDIR/i)
      assert.equal(result.globalConfigPath, path.join(invalidHonchoDir, "config.json"))
    })
  },
)
