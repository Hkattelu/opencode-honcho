import { expect, test } from "bun:test"
import os from "node:os"
import path from "node:path"
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises"

import tuiModule, { __testing } from "../dist/tui.js"

test("tui exports testing helpers for cloud api key validation", () => {
  expect(tuiModule.id).toBe("@honcho-ai/opencode-honcho")
  expect(__testing.validateCloudApiKey("")).toMatch(/requires a Honcho API key/i)
  expect(__testing.validateCloudApiKey("hch-test-key")).toBeNull()
})

test("status message still reports cloud mode without a key as not configured", () => {
  const message = __testing.statusMessage({
    apiKey: "",
    hosts: {
      opencode: {
        baseUrl: "https://api.honcho.dev",
      },
    },
  })

  expect(message).toMatch(/Configured: no/)
  expect(message).toMatch(/Run \/honcho:setup to finish configuration\./)
})

test("saveSettings persists only the core hosts.opencode fields", async () => {
  const homeDir = await mkdtemp(path.join(os.tmpdir(), "honcho-tui-home-"))
  const sharedConfigDir = path.join(homeDir, ".honcho")
  const sharedConfigPath = path.join(sharedConfigDir, "config.json")
  const previousHome = process.env.HOME

  await mkdir(sharedConfigDir, { recursive: true })
  await writeFile(sharedConfigPath, JSON.stringify({}, null, 2))
  process.env.HOME = homeDir

  try {
    await __testing.saveSettings({
      apiKey: "key",
      hosts: {
        opencode: {
          baseUrl: "https://api.honcho.dev",
        },
      },
    })

    const persisted = JSON.parse(await readFile(sharedConfigPath, "utf-8"))
    expect(persisted.hosts.opencode).toEqual({
      enabled: true,
      baseUrl: "https://api.honcho.dev",
      workspace: "opencode",
      aiPeer: "opencode",
      globalOverride: false,
      recallMode: "hybrid",
      observation: "directional",
      peerModel: "classic",
      writeFrequency: "async",
      sessionStrategy: "per-directory",
    })
  } finally {
    if (previousHome === undefined) delete process.env.HOME
    else process.env.HOME = previousHome
  }
})
