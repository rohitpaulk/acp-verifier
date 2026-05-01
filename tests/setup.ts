import { setDefaultTimeout, afterAll } from "bun:test";

setDefaultTimeout(15_000);

await import("../scripts/generate-check-slugs");

const { AgentRegistry } = await import("../lib/agent-registry");
const { CheckCollectorRegistry } = await import("../lib/check-collector-registry");
const { writeResults } = await import("../lib/results-writer");

export const registry = new AgentRegistry();
await registry.buildAllImages();

export const checkCollectorRegistry = new CheckCollectorRegistry(registry);

afterAll(() => {
  checkCollectorRegistry.printResults();
  writeResults(checkCollectorRegistry);
});
