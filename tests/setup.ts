import { resolve } from "node:path";
import { setDefaultTimeout, afterAll } from "bun:test";

setDefaultTimeout(15_000);

await import("../scripts/generate-check-slugs");

const { AgentRegistry } = await import("../lib/agent-registry");
const { CheckCollectorRegistry } = await import("../lib/check-collector-registry");
const { readResultsFile, writeResultsFile } = await import("../lib/results-file-io");

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const OUTPUT_PATH = resolve(PROJECT_ROOT, "web/data/results.json");

export const registry = new AgentRegistry();
await registry.buildAllImages();

export const checkCollectorRegistry = new CheckCollectorRegistry(registry);

afterAll(() => {
  checkCollectorRegistry.printResults();

  const oldResults = readResultsFile(OUTPUT_PATH);
  const newResults = checkCollectorRegistry.toResultsFile();

  writeResultsFile(OUTPUT_PATH, oldResults.merge(newResults));

  console.log(`\nWrote results to ${OUTPUT_PATH}`);
});
