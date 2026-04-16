import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import os from "node:os"

import { __testing } from "../dist/index.js"

test("default session strategy matches Claude Code's per-directory behavior", () => {
  assert.equal(__testing.defaultSettings.sessionStrategy, "per-directory")
})

test("chat-instance session strategy keys sessions by session id", async () => {
  const sessionScope = await __testing.deriveSessionScope({
    workspaceId: "shared",
    sessionStrategy: "chat-instance",
    rootDir: "/tmp/project",
    repoName: "project",
    currentDirectory: "/tmp/project",
    sessionId: "session-123",
  })

  assert.equal(sessionScope, "shared:session-123")
})

test("git-branch session strategy uses the current branch name when available", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "opencode-git-branch-"))
  await mkdir(path.join(rootDir, ".git"), { recursive: true })
  await writeFile(path.join(rootDir, ".git", "HEAD"), "ref: refs/heads/feature/test-branch\n", "utf-8")

  const sessionScope = await __testing.deriveSessionScope({
    workspaceId: "shared",
    sessionStrategy: "git-branch",
    rootDir,
    repoName: "project",
    currentDirectory: rootDir,
    sessionId: "session-123",
  })

  assert.equal(sessionScope, "shared:feature-test-branch")
})

test("git-branch session strategy falls back to the repo name when HEAD is detached", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "opencode-git-detached-"))
  await mkdir(path.join(rootDir, ".git"), { recursive: true })
  await writeFile(path.join(rootDir, ".git", "HEAD"), "1f2e3d4c5b6a\n", "utf-8")

  const sessionScope = await __testing.deriveSessionScope({
    workspaceId: "shared",
    sessionStrategy: "git-branch",
    rootDir,
    repoName: "project",
    currentDirectory: rootDir,
    sessionId: "session-123",
  })

  assert.equal(sessionScope, "shared:project")
})
