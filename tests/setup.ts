import { setDefaultTimeout, afterAll } from "bun:test";
import chalk from "chalk";
import { AgentRegistry } from "../lib/agent-registry";
import { CheckCollectorRegistry } from "../lib/check-collector-registry";

setDefaultTimeout(15_000);

export const registry = new AgentRegistry();
await registry.buildAllImages();

export const checkCollectorRegistry = new CheckCollectorRegistry(registry);

afterAll(() => {
  const collectors = [...checkCollectorRegistry.map.values()];
  if (collectors.length === 0) return;

  const first = collectors[0];
  if (!first) return;
  const allChecks = [...first.checkSlugs];
  const agentSlugs = collectors.map((c) => c.agent.slug);

  console.log("\n" + chalk.bold("Check Results"));
  console.log("=".repeat(60));

  for (const check of allChecks) {
    const passed: string[] = [];
    const failed: string[] = [];
    const untested: string[] = [];

    for (const collector of collectors) {
      if (collector.passedCheckSlugs.has(check)) {
        passed.push(collector.agent.slug);
      } else if (collector.failedCheckSlugs.has(check)) {
        failed.push(collector.agent.slug);
      } else {
        untested.push(collector.agent.slug);
      }
    }

    console.log(`\n${chalk.bold(check)}`);

    if (passed.length > 0) {
      console.log(`  ${chalk.green("PASS")}: ${passed.join(", ")}`);
    }
    if (failed.length > 0) {
      console.log(`  ${chalk.red("FAIL")}: ${failed.join(", ")}`);
    }
    if (untested.length > 0) {
      console.log(`  ${chalk.gray("SKIP")}: ${untested.join(", ")}`);
    }
  }

  console.log("\n" + "=".repeat(60));
});

