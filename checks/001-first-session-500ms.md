---
label: First session < 500ms
---

This check verifies that the agent boots and responds to the [`initialize`](https://agentclientprotocol.com/protocol/initialization) and [`session/new`](https://agentclientprotocol.com/protocol/session-setup#creating-a-session) within 500ms.

**Why is this important?**

- This affects the load time of the first chat session.
- For native agents like Cursor & Zed this load time is usually ~zero.

**Notes**

- There's a separate "New session < 500ms" check that tracks load times for subsequent sessions.
