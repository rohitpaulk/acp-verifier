import type { Config } from "@react-router/dev/config";
import resultsData from "./data/results.json";
import { ResultsFile } from "./src/results-file";

const results = ResultsFile.fromJSON(resultsData);
const agentSlugs = results.agents.map((agent) => agent.slug);

export default {
  appDirectory: "src",
  buildDirectory: "dist",
  ssr: false,
  prerender: ["/", "/404", ...agentSlugs.map((slug) => `/${slug}`)],
} satisfies Config;
