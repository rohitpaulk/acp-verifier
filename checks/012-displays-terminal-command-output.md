---
label: Displays terminal output
description: Leaves terminal output visible to the user through terminal content embedded in tool calls
---

This check verifies that terminal output remains displayable by embedding the terminal in a tool call whose output contains the command result.

### Why is this important?

Users need to see the command output that led to the agent's next steps, especially for test failures, build errors, and generated logs. Terminal content in tool calls lets clients display this output directly in the conversation.
