---
label: Streams terminal output
description: Polls terminal output while commands are running so command progress can be streamed
---

This check verifies that after creating a terminal, the agent requests the command's output through [`terminal/output`](https://agentclientprotocol.com/protocol/terminals#getting-output).

### Why is this important?

Long-running commands should not feel like black boxes. Polling terminal output lets the agent observe progress, react to failures, and keep users informed while work is still in progress.
