import type { Config } from "@react-router/dev/config";

// TODO: dynamically pull from agent results JSON
const agentSlugs = ["codex", "copilot"];

export default {
  appDirectory: "src",
  buildDirectory: "dist",
  ssr: false,
  prerender: ["/", "/404", ...agentSlugs.map((slug) => `/${slug}`)],
} satisfies Config;
