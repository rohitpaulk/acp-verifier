import { resolve } from "node:path";
import { readdirSync } from "fs";
import type { Agent } from "./agent";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const CHECKS_DIR = resolve(PROJECT_ROOT, "checks");

export class CheckCollector {
  readonly agent: Agent;
  readonly checkSlugs: string[];

  constructor(agent: Agent) {
    this.agent = agent;
    this.checkSlugs = this.discoverCheckSlugs();
  }

  pass(slug: string): boolean {
    return this.checkSlugs.includes(slug);
  }

  fail(slug: string): boolean {
    return !this.pass(slug);
  }

  private discoverCheckSlugs(): string[] {
    const entries = readdirSync(CHECKS_DIR, { withFileTypes: true });

    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name.replace(/\.md$/, ""));
  }
}
