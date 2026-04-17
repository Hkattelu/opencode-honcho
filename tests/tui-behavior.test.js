import test from "node:test"
import assert from "node:assert/strict"

import tuiModule, { __testing } from "../dist/tui.js"

test("tui exports testing helpers for cloud api key validation", () => {
  assert.equal(tuiModule.id, "@honcho-ai/opencode-honcho")
  assert.match(__testing.validateCloudApiKey(""), /requires a Honcho API key/i)
  assert.equal(__testing.validateCloudApiKey("hch-test-key"), null)
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

  assert.match(message, /Configured: no/)
  assert.match(message, /Run \/honcho:setup to finish configuration\./)
})
