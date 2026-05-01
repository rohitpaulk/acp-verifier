import chalk from "chalk";
import { CheckCollector } from "./check-collector";
import { AgentRegistry } from "./agent-registry";

export class CheckCollectorRegistry {
  readonly map: Map<string, CheckCollector>;

  constructor(agentRegistry: AgentRegistry) {
    this.map = new Map();

    for (const agent of agentRegistry.agents) {
      this.map.set(agent.slug, new CheckCollector(agent));
    }
  }

  get(slug: string): CheckCollector {
    const collector = this.map.get(slug);
    if (!collector) {
      throw new Error(`Unknown agent: ${slug}`);
    }
    return collector;
  }

  printResults(): void {
    const collectors = [...this.map.values()];
    const checkSlugs = collectors[0]!.checkSlugs;

    console.log("\n" + chalk.bold("Check Results"));
    console.log("=".repeat(60));

    for (const checkSlug of checkSlugs) {
      console.log(`\n${chalk.bold(checkSlug)}`);

      for (const collector of collectors) {
        let status: string;

        if (collector.passedCheckSlugs.has(checkSlug)) {
          status = chalk.green("PASS");
        } else if (collector.failedCheckSlugs.has(checkSlug)) {
          status = chalk.red("FAIL");
        } else {
          status = chalk.gray("SKIP");
        }

        const message = collector.checkMessages.get(checkSlug);
        console.log(`  ${collector.agent.slug}: ${status}${message ? ` — ${message}` : ""}`);
      }
    }

    console.log("\n" + "=".repeat(60));
  }
}
