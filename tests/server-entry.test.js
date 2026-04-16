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

test("Honcho SDK constructor resolver accepts namespace and CJS-default shapes", () => {
  class FakeHoncho {}

  assert.equal(__testing.resolveHonchoCtor({ Honcho: FakeHoncho }), FakeHoncho)
  assert.equal(__testing.resolveHonchoCtor({ default: { Honcho: FakeHoncho } }), FakeHoncho)
  assert.equal(__testing.resolveHonchoCtor({ default: { default: { Honcho: FakeHoncho } } }), FakeHoncho)
})

test("Honcho SDK loader uses the explicit vendored dist entry", () => {
  assert.equal(__testing.honchoSdkImportPath, "../vendor/honcho-sdk/dist/index.js")
})
