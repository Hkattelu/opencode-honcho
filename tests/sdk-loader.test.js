import { expect, test } from "bun:test"

import { __testing } from "../dist/index.js"

test("Honcho SDK import path uses @honcho-ai/sdk package", () => {
  expect(__testing.honchoSdkImportPath).toBe("@honcho-ai/sdk")
})
