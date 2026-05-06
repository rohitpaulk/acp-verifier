---
label: Loads skills < 500ms
---

This check verifies that skills are loaded as [slash commands](https://agentclientprotocol.com/protocol/slash-commands) within 500ms of creating a session. 

**Why is this important?**

- Often sessions are created with the sole purpose of running a skill (like `/bump-version`).
- If skills aren't loaded quick enough, a chat session can feel laggy since users have to wait till they're loaded to invoke the skill.
