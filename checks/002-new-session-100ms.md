---
label: New session < 100ms
---

This check verifies that the agent responds to the `session/new` request within 100ms. The check is performed after the agent has booted and created at least one session.

**Why is this important?**

- This affects the load time of chat sessions after the first one, which is something users will run into multiple times a day.
- For native agents like Cursor & Zed this load time is usually ~zero.

**Notes**

- There's a separate "First session < 500ms" check that tracks load times for the first session, which includes the agent boot time.
