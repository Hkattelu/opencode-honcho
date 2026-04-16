import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

import tuiModule from "../dist/tui.js"

test("package.json exposes an explicit OpenCode TUI entry", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf-8"))

  assert.equal(pkg.name, "@honcho-ai/opencode-honcho")
  assert.equal(pkg.exports["./tui"].import, "./dist/tui.js")
})

test("tui entry default export matches OpenCode plugin expectations", () => {
  assert.equal(tuiModule.id, "@honcho-ai/opencode-honcho")
  assert.equal(typeof tuiModule.tui, "function")
})
