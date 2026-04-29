# ACP Verifier Web

React Router framework-mode app for the "Are we ACP yet?" status site.

## Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   ├── data/
│   ├── routes/
│   ├── styles/
│   ├── root.tsx
│   └── routes.ts
├── package.json
├── react-router.config.ts
└── vite.config.ts
```

Static assets live in `public/`. Mock verifier results currently live in
`src/data/mock-results.json`.

## Commands

All commands are run from this directory:

| Command           | Action                               |
| :---------------- | :----------------------------------- |
| `bun install`     | Installs dependencies                |
| `bun run dev`     | Starts the React Router dev server   |
| `bun run build`   | Builds the production site to `dist/client` |
| `bun run preview` | Previews the production build        |

The app runs in React Router SPA mode (`ssr: false`) and handles `/` and
`/:agent` paths client-side. Production hosts should serve `index.html` from
`dist/client` as the fallback for agent detail URLs.
