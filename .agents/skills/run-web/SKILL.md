---
name: run-web
description: Run or validate the web app using Bun
---

# Run Web

Use this skill when you need to run or validate the web app.

- Work from `web/`.
- Use Bun, not npm/yarn/pnpm.
- Install deps if needed: `bun install`.
- Start local dev server: `bun run dev`.
- Validate production build: `bun run build`.
- Preview built site: `bun run preview`.

Notes:
- This is a React Router SPA app.
- Dev/preview servers are long-running; only start them when requested, and use a bounded timeout unless the user asks otherwise.
