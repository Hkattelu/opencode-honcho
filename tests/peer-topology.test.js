import test from "node:test"
import assert from "node:assert/strict"

import { __testing } from "../dist/index.js"

test("root sessions keep user and root agent as peers", () => {
  const topology = __testing.buildPeerTopology({
    config: { peerModel: "classic" },
    peerModel: "classic",
    userPeerId: "user:alice",
    rootAgentPeerId: "opencode",
    activeAgentPeerId: "opencode",
    childAgentPeerId: null,
    parentAgentObserverPeerId: null,
  })

  assert.deepEqual(topology.sessionPeerConfigs, {
    "user:alice": { observeMe: true, observeOthers: false },
    opencode: { observeMe: true, observeOthers: true },
  })
  assert.equal(topology.describedPeers.childAgentPeer, null)
  assert.equal(topology.describedPeers.parentAgentObserverPeer, null)
})

test("classic peer model keeps delegated sessions on the Claude-style user and ai peers", () => {
  const topology = __testing.buildPeerTopology({
    config: { peerModel: "classic" },
    peerModel: "classic",
    userPeerId: "user:alice",
    rootAgentPeerId: "opencode",
    activeAgentPeerId: "opencode:reviewer",
    childAgentPeerId: "opencode:reviewer",
    parentAgentObserverPeerId: "opencode:root-parent",
  })

  assert.deepEqual(topology.sessionPeerConfigs, {
    "user:alice": { observeMe: true, observeOthers: false },
    opencode: { observeMe: true, observeOthers: true },
  })
  assert.equal(topology.describedPeers.childAgentPeer, null)
  assert.equal(topology.describedPeers.parentAgentObserverPeer, null)
})

test("hierarchical peer model scopes parent observation to the child peer only", () => {
  const topology = __testing.buildPeerTopology({
    config: { peerModel: "hierarchical" },
    peerModel: "hierarchical",
    userPeerId: "user:alice",
    rootAgentPeerId: "opencode",
    activeAgentPeerId: "opencode:reviewer",
    childAgentPeerId: "opencode:reviewer",
    parentAgentObserverPeerId: "opencode:root-parent",
  })

  assert.deepEqual(topology.sessionPeerConfigs, {
    "opencode:reviewer": { observeMe: true, observeOthers: false },
    "opencode:root-parent": { observeMe: false, observeOthers: true },
  })
  assert.deepEqual(topology.describedPeers.childAgentPeer, {
    id: "opencode:reviewer",
    observeMe: true,
    observeOthers: false,
    sessionScoped: true,
  })
  assert.deepEqual(topology.describedPeers.parentAgentObserverPeer, {
    id: "opencode:root-parent",
    observeMe: false,
    observeOthers: true,
    modelsOnly: ["opencode:reviewer"],
  })
})
