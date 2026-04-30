---
label: Displays running terminal command
description: Embeds the active terminal in an in-progress execute tool call
---

This check verifies that the agent includes terminal content in a `tool_call` or `tool_call_update` while the command is in progress.

### Why is this important?

Clients can only render a live terminal UI when the agent embeds the terminal ID in a tool call. This gives users immediate visibility into which command is running and where to watch its progress.
