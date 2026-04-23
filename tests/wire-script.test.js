import { test, expect } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

test("package.json exposes a wire script for local checkout installs", async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(import.meta.dir, "..", "package.json"), "utf-8"),
  )

  expect(packageJson.scripts?.wire).toBe("bun run build && node ./scripts/wire.js")
})
