import test from "node:test"
import assert from "node:assert/strict"

import { __testing } from "../dist/index.js"

test("extractCompletedAssistantMessage uses current-turn parts and completion timestamp", () => {
  const partState = new Map()

  __testing.upsertAssistantMessagePart(partState, {
    event: {
      type: "message.part.updated",
      properties: {
        part: {
          id: "part-reasoning",
          sessionID: "ses-123",
          messageID: "msg-123",
          type: "reasoning",
          text: "internal",
          time: { start: 1710000000000 },
        },
      },
    },
  })
  __testing.upsertAssistantMessagePart(partState, {
    event: {
      type: "message.part.updated",
      properties: {
        part: {
          id: "part-visible",
          sessionID: "ses-123",
          messageID: "msg-123",
          type: "text",
          text: "Final reply",
          time: { start: 1710000000001 },
        },
      },
    },
  })

  assert.deepEqual(
    __testing.extractCompletedAssistantMessage(
      {
        event: {
          type: "message.updated",
          properties: {
            info: {
              id: "msg-123",
              sessionID: "ses-123",
              role: "assistant",
              time: {
                created: 1710000000000,
                completed: 1710000004321,
              },
            },
          },
        },
      },
      partState,
    ),
    {
      messageId: "msg-123",
      sessionID: "ses-123",
      text: "Final reply",
      createdAt: "2024-03-09T16:00:04.321Z",
    },
  )
})

test("extractSessionId reads session id from nested event info", () => {
  assert.equal(
    __testing.extractSessionId({
      event: {
        type: "message.updated",
        properties: {
          info: { role: "assistant", sessionID: "ses-789" },
        },
      },
    }),
    "ses-789",
  )
})

test("extractSessionId reads session id from message.part.updated payloads", () => {
  assert.equal(
    __testing.extractSessionId({
      event: {
        type: "message.part.updated",
        properties: {
          part: { sessionID: "ses-456" },
        },
      },
    }),
    "ses-456",
  )
})

test("markAssistantMessageCaptured only marks the message after persistence succeeds", async () => {
  const state = __testing.createSessionState()
  state.assistantMessageParts.set("msg-123", {
    sessionID: "ses-123",
    parts: new Map([["part-visible", "Final reply"]]),
  })

  let attempts = 0
  await assert.rejects(
    __testing.markAssistantMessageCaptured(state, { messageId: "msg-123" }, async () => {
      attempts += 1
      throw new Error("transient write failure")
    }),
    /transient write failure/,
  )

  assert.equal(attempts, 1)
  assert.equal(state.capturedAssistantMessageIds.has("msg-123"), false)
  assert.equal(state.assistantMessageParts.has("msg-123"), true)

  const captured = await __testing.markAssistantMessageCaptured(state, { messageId: "msg-123" }, async () => {
    attempts += 1
  })

  assert.equal(captured, true)
  assert.equal(attempts, 2)
  assert.equal(state.capturedAssistantMessageIds.has("msg-123"), true)
  assert.equal(state.assistantMessageParts.has("msg-123"), false)
})
