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
  "honcho_setup persists honchoApiKey and switches a persisted local baseUrl back to cloud when only an apiKey is provided",
  { concurrency: false },
  async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "honcho-setup-cloud-"))
  const configHome = await mkdtemp(path.join(os.tmpdir(), "honcho-config-home-"))
  const globalConfigDir = path.join(configHome, "opencode")
  const globalConfigPath = path.join(globalConfigDir, "honcho.json")

  await mkdir(globalConfigDir, { recursive: true })
  await writeFile(
    globalConfigPath,
    JSON.stringify(
      {
        baseUrl: "http://127.0.0.1:8010",
        apiKey: "old-key",
        hosts: {
          opencode: {
            workspace: "opencode",
            aiPeer: "opencode",
            linkedHosts: [],
          },
        },
      },
      null,
      2,
    ),
  )

  await withEnv({ XDG_CONFIG_HOME: configHome }, async () => {
    const hooks = await createPluginHarness(rootDir)
    const honchoSetup = hooks.tool.honcho_setup
    const result = JSON.parse(await honchoSetup.execute({ apiKey: "new-key" }, toolContext(rootDir)))
    const persisted = JSON.parse(await readFile(globalConfigPath, "utf-8"))

    assert.equal(result.ok, true)
    assert.equal(result.status.baseUrl, "https://api.honcho.dev")
    assert.equal(persisted.baseUrl, "https://api.honcho.dev")
    assert.equal(persisted.honchoApiKey, "new-key")
    assert.equal(persisted.apiKey, undefined)
    assert.deepEqual(result.persistedFields.sort(), ["baseUrl", "honchoApiKey"])
    assert.equal(result.status.peers.userPeer.observe_me, true)
    assert.equal(result.status.peers.userPeer.observe_others, false)
    assert.equal(result.status.peers.userPeer.observeMe, undefined)
  })
  },
)

test(
  "honcho_status treats honchoApiKey as the configured credential field",
  { concurrency: false },
  async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "honcho-status-honcho-api-key-"))
    const configHome = await mkdtemp(path.join(os.tmpdir(), "honcho-config-home-status-"))
    const globalConfigDir = path.join(configHome, "opencode")
    const globalConfigPath = path.join(globalConfigDir, "honcho.json")

    await mkdir(globalConfigDir, { recursive: true })
    await writeFile(
      globalConfigPath,
      JSON.stringify(
        {
          honchoApiKey: "status-key",
          baseUrl: "https://api.honcho.dev",
        },
        null,
        2,
      ),
    )

    await withEnv({ XDG_CONFIG_HOME: configHome }, async () => {
      const hooks = await createPluginHarness(rootDir)
      const result = JSON.parse(await hooks.tool.honcho_status.execute({}, toolContext(rootDir)))

      assert.equal(result.ok, true)
      assert.equal(result.configured, true)
      assert.equal(result.baseUrl, "https://api.honcho.dev")
      assert.equal(result.peers.userPeer.observe_me, true)
      assert.equal(result.peers.rootAgentPeer.observe_others, true)
      assert.equal(result.peers.rootAgentPeer.observeOthers, undefined)
    })
  },
)

test(
  "honcho_setup returns a structured error when the global config path cannot be written",
  { concurrency: false },
  async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "honcho-setup-error-"))
    const configHome = await mkdtemp(path.join(os.tmpdir(), "honcho-config-home-error-"))
    const invalidConfigHome = path.join(configHome, "blocked-home")

    await writeFile(invalidConfigHome, "not a directory\n")

    await withEnv({ XDG_CONFIG_HOME: invalidConfigHome }, async () => {
      const hooks = await createPluginHarness(rootDir)
      const honchoSetup = hooks.tool.honcho_setup
      const result = JSON.parse(await honchoSetup.execute({ apiKey: "new-key" }, toolContext(rootDir)))

      assert.equal(result.ok, false)
      assert.match(result.error, /persist|config|directory|ENOTDIR/i)
      assert.equal(result.globalConfigPath, path.join(invalidConfigHome, "opencode", "honcho.json"))
    })
  },
)
