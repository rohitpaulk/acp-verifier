---
label: Executes terminal commands
description: Uses the ACP terminal capability to run commands in the client environment
---

This check verifies that when the client advertises terminal support, the agent can execute a command through the ACP [`terminal/create`](https://agentclientprotocol.com/protocol/terminals#executing-commands) method.

### Why is this important?

Agents often need to run tests, builds, formatters, and other command-line tools. Using ACP terminals lets clients keep command execution in the user's environment while retaining visibility and control over the process.
