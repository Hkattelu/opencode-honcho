import { spawnSync } from "node:child_process"

const args = ["./dist/cli.js", "install", "--plugin-spec", process.cwd(), "--force"]

if (process.env.OPENCODE_CONFIG_DIR) {
  args.push("--config-dir", process.env.OPENCODE_CONFIG_DIR)
}

const result = spawnSync("bun", args, {
  stdio: "inherit",
  env: process.env,
})

if (typeof result.status === "number") {
  process.exit(result.status)
}

if (result.error) {
  throw result.error
}

process.exit(1)
