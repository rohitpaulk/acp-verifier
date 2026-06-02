---
label: Streams reasoning
---

This check verifies that the agent streams its internal reasoning traces using [`agent_thought_chunk`](https://agentclientprotocol.com/protocol/prompt-turn#agent-thoughts) session updates when responding to a prompt.

**Why is this important?**

- Surfacing the agent's reasoning helps users understand and trust how an answer was reached.
- Many models produce thinking/reasoning, but some agents don't forward it to the client as `agent_thought_chunk` updates, so it never shows up in the UI.
