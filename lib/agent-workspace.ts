import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export class AgentWorkspace {
  readonly path: string;

  constructor(path: string) {
    this.path = resolve(path);
  }

  addSkill(name: string, description: string): void {
    const skillDir = join(this.path, ".agents", "skills", name);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), skillMarkdown(name, description));
  }

  [Symbol.dispose](): void {
    rmSync(this.path, { recursive: true, force: true });
  }
}

function skillMarkdown(name: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\nUse this skill only for ACP verifier tests.\n`;
}
