import test from "node:test"
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import { mkdtemp } from "node:fs/promises"
import { spawn } from "node:child_process"

test("install command explains how to recover when opencode is not on PATH", async () => {
  const homeDir = await mkdtemp(path.join(os.tmpdir(), "opencode-cli-home-"))
  const configDir = await mkdtemp(path.join(os.tmpdir(), "opencode-cli-config-"))

  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["dist/cli.js", "install", "--config-dir", configDir], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: "/usr/bin:/bin",
      },
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })
    child.on("error", reject)
    child.on("exit", (code) => resolve({ code, stdout, stderr }))
  })

  assert.equal(result.code, 1)
  assert.match(
    result.stderr,
    /opencode CLI was not found on PATH|restart your shell|source .*rc/i,
  )
})
