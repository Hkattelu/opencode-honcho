# @plasticlabs/opencode-honcho

TypeScript-native Honcho plugin runtime for OpenCode.

This package is the publishable runtime that powers the generated local OpenCode plugin bundle. It uses the Honcho TypeScript SDK directly and integrates with OpenCode's native plugin hooks for:

- prompt-level memory injection
- automatic durable memory writes
- multi-agent peer and session mapping
- project-local overrides plus global OpenCode Honcho config
- native OpenCode tools and slash-command control

## Repository Layout

- `src/*.ts` is the source of truth
- `dist/*.js` is the checked-in runtime artifact used by emitted OpenCode bundles
- `vendor/honcho-sdk` and `vendor/zod` are vendored runtime dependencies used to avoid plugin startup resolution issues inside OpenCode

## Setup

### Development

```bash
npm install
npm run check
npm run build
```

### Package Validation

```bash
npm pack
```

### OpenCode Runtime Usage

This package is meant to be consumed by an emitted local OpenCode bundle, not installed as a standalone top-level OpenCode command.

The generated OpenCode project bundle should contain:

- `opencode.json`
- `.opencode/plugins/honcho-runtime.js`
- `.opencode/package.json`
- `.opencode/honcho.json`

The thin plugin shim imports this package's `dist/index.js`.

## Runtime Config

The runtime uses two config layers:

- global OpenCode Honcho config: `~/.config/opencode/honcho.json`
- project overrides: `.opencode/honcho.json`

Effective precedence is:

1. project `.opencode/honcho.json`
2. global `~/.config/opencode/honcho.json`
3. environment
4. built defaults

The default global host mapping is Claude-style under `hosts.opencode`:

```json
{
  "apiKey": "hch-...",
  "peerName": "alice",
  "globalOverride": false,
  "hosts": {
    "opencode": {
      "workspace": "opencode",
      "aiPeer": "opencode",
      "linkedHosts": []
    }
  }
}
```

For a local Honcho instance, set `baseUrl` to `http://127.0.0.1:8000` or `http://localhost:8000`. Localhost mode is allowed without an API key; cloud mode still expects one.

## OpenCode Behavior

The runtime intentionally reflects current OpenCode host capabilities:

- `hard_command_interception`: unsupported
- `pre_model_command_execute`: supported
- `structured_question_ui`: unsupported
- `persistent_background_runtime`: unsupported

The runtime follows Claude-style memory layering:

- deeper warmup at session start
- cached lightweight prompt injection on normal turns
- explicit deep retrieval through Honcho tools

## OpenCode to Honcho Mapping

### Config Mapping

- Global user-wide config: `~/.config/opencode/honcho.json`
- Project overrides: `.opencode/honcho.json`
- Fallback environment: `HONCHO_API_KEY`, `HONCHO_URL`, `HONCHO_BASE_URL`, `HONCHO_PEER_NAME`, `HONCHO_WORKSPACE`

Effective precedence is:

1. project `.opencode/honcho.json`
2. global `~/.config/opencode/honcho.json`
3. environment
4. built defaults

### Workspace Mapping

- `workspace` maps to the Honcho workspace namespace
- Prefer top-level `workspace` when `globalOverride` is enabled
- Otherwise prefer `hosts.opencode.workspace`
- Fall back to repo- or project-derived workspace only when no explicit workspace is configured

This makes OpenCode align more closely with Claude Code's host-aware workspace model while still allowing per-project overrides.

### Peer Mapping

- `peerName` maps to the human user peer
- `aiPeer` maps to the root OpenCode agent peer
- Child OpenCode agents map to child Honcho agent peers
- Parent OpenCode agents can be attached as observer peers in child-agent contexts

Child-agent contexts are intentionally session-scoped: the delegated child peer is the active worker, and the parent observer is scoped to that child session rather than modeling the root AI peer or the user peer directly.

Default peer observation semantics are:

- user peer: `observeMe=true`, `observeOthers=false`
- root agent peer: `observeMe=true`, `observeOthers=true`
- child agent peer: `observeMe=true`, `observeOthers=false`, `sessionScoped=true`
- parent observer peer: `observeMe=false`, `observeOthers=true`, `modelsOnly=[childPeer]`

### Session Mapping

- `sessionStrategy=per-repo`: one stable Honcho session per workspace and agent lineage
- `sessionStrategy=per-directory`: one stable Honcho session per working directory and agent lineage
- `sessionStrategy=per-session`: one Honcho session per OpenCode session id
- `sessionStrategy=global`: one long-lived Honcho session for the configured workspace

Sessions are enabled by default. The default strategy is `per-repo`.

### Hook Mapping

- `event`: session lifecycle, warmup, and cleanup
- `chat.message`: observe user messages and trigger durable write heuristics
- `tool.execute.after`: observe tool outputs and trigger durable write heuristics
- `experimental.chat.system.transform`: inject cached Honcho prompt memory
- `experimental.session.compacting`: preserve continuity across compaction
- `shell.env`: expose resolved Honcho env into shell context

### Tool and Command Mapping

OpenCode-native tools provided by the runtime:

- `honcho_setup`
- `honcho_status`
- `honcho_get_config`
- `honcho_set_config`
- `honcho_search`
- `honcho_chat`
- `honcho_create_conclusion`

Expected OpenCode command layer from the emitted bundle:

- `/honcho:setup`
- `/honcho:status`
- `/honcho:settings`
- `/honcho:set`
- `/honcho:unset`
- `/honcho:mode`
- `/honcho:write`
- `/honcho:interview`

### Memory Layering

The runtime follows a Claude-style layering model:

- session-start deep warmup for stable user, agent, and summary context
- cached lightweight prompt injection on normal turns
- explicit deep retrieval through Honcho tools when more context is needed

## Publishing

This repo is the npm package surface that should be published as `@plasticlabs/opencode-honcho`.

It should include:

- `src/`
- `dist/`
- `vendor/`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `package.json`
- `tsconfig.json`

It should not include generated project `.opencode/` bundles or machine-local config.
