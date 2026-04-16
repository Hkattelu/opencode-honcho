import test from "node:test"
import assert from "node:assert/strict"

import { __testing } from "../dist/index.js"

test("Honcho SDK constructor resolver accepts namespace and nested default shapes", () => {
  class FakeHoncho {}

  assert.equal(__testing.resolveHonchoCtor({ Honcho: FakeHoncho }), FakeHoncho)
  assert.equal(__testing.resolveHonchoCtor({ default: { Honcho: FakeHoncho } }), FakeHoncho)
  assert.equal(__testing.resolveHonchoCtor({ default: { default: { Honcho: FakeHoncho } } }), FakeHoncho)
})

test("Honcho SDK constructor resolver reports import path and module keys on invalid shape", () => {
  assert.throws(
    () => __testing.resolveHonchoCtor({ nope: true }),
    /Honcho SDK constructor is unavailable.*import path.*vendor\/honcho-sdk\/dist\/index\.js.*module keys.*nope/i,
  )
})

test("Honcho SDK loader uses the explicit vendored dist entry", () => {
  assert.equal(__testing.honchoSdkImportPath, "../vendor/honcho-sdk/dist/index.js")
})

test("Honcho SDK loader can resolve the vendored SDK in this runtime", async () => {
  const ctor = await __testing.loadHonchoCtorForTest()
  assert.equal(typeof ctor, "function")
  assert.equal(ctor.name, "Honcho")
})

test("Honcho SDK loader falls back to require() when import returns an unusable module shape", async () => {
  class FakeHoncho {}

  const module = await __testing.loadHonchoModuleForTest({
    requireImpl: (specifier) => {
      assert.equal(specifier, __testing.honchoSdkImportPath)
      return { Honcho: FakeHoncho }
    },
    importImpl: async () => ({}),
  })

  assert.equal(module.Honcho, FakeHoncho)
})
