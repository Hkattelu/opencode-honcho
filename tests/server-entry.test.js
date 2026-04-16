import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

import serverModule from "../dist/server.js"
import { __testing } from "../dist/index.js"

test("package.json exposes an explicit OpenCode server entry", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf-8"))

  assert.equal(pkg.name, "@honcho-ai/opencode-honcho")
  assert.equal(pkg.exports["./server"].import, "./dist/server.js")
})

test("server entry default export matches OpenCode plugin expectations", () => {
  assert.equal(serverModule.id, "@honcho-ai/opencode-honcho")
  assert.equal(typeof serverModule.server, "function")
})

test("Honcho SDK import path uses @honcho-ai/sdk package", () => {
  assert.equal(__testing.honchoSdkImportPath, "@honcho-ai/sdk")
})
