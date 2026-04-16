import test from "node:test"
import assert from "node:assert/strict"

import { __testing } from "../dist/index.js"

test("normalizeId trims leading and trailing hyphens without regex backtracking risk", () => {
  assert.equal(__testing.normalizeId("---Alpha Beta---"), "alpha-beta")
  assert.equal(__testing.normalizeId("-".repeat(256)), "default")
})
