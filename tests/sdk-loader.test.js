import test from "node:test"
import assert from "node:assert/strict"

import { __testing } from "../dist/index.js"

test("Honcho SDK import path uses @honcho-ai/sdk package", () => {
  assert.equal(__testing.honchoSdkImportPath, "@honcho-ai/sdk")
})
