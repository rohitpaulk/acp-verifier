import { parse as parseDotenv } from "dotenv";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { parse as parseYaml } from "yaml";
import CommandRunner from "./command-runner";

const AGENTS_DIR = resolve(import.meta.dir, "../agents");

type AgentConfigYAML = {
  name: string;
  company: string;
  version_string: string;
  env_vars: string[];
  symlinks?: Record<string, string>;
};

export class Agent {
  readonly slug: string;
  readonly name: string;
  readonly company: string;
  readonly versionString: string;
  readonly env: Record<string, string>;
  readonly symlinks: Record<string, string>;

  constructor(opts: {
    slug: string;
    name: string;
    company: string;
    versionString: string;
    env: Record<string, string>;
    symlinks: Record<string, string>;
  }) {
    this.slug = opts.slug;
    this.name = opts.name;
    this.company = opts.company;
    this.versionString = opts.versionString;
    this.env = opts.env;
    this.symlinks = opts.symlinks;
  }

  static fromDir(dir: string): Agent {
    const agentDir = resolve(AGENTS_DIR, dir);
    const env = loadEnvFile(resolve(agentDir, ".env"));

    const configPath = resolve(agentDir, "agent.yaml");
    const raw = readFileSync(configPath, "utf-8");
    const config = parseYaml(raw) as AgentConfigYAML;

    const missingEnvVars = config.env_vars.filter((v) => !env[v]);

    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required env vars for ${dir}: ${missingEnvVars.join(", ")}`);
    }

    return new Agent({
      slug: dir,
      name: config.name,
      company: config.company,
      versionString: config.version_string,
      env,
      symlinks: config.symlinks ?? {},
    });
  }

  get imageName(): string {
    return `acp-verifier-${this.slug}`;
  }

  async buildImage(): Promise<void> {
    const buildCommand = `docker build -t ${this.imageName} ${this.#dockerBuildContext}`;

    await CommandRunner.run(buildCommand, { logPrefix: `build-${this.slug}` });
  }

  createWorkspace(): AgentWorkspace {
    const workspace = new AgentWorkspace(mkdtempSync(join(tmpdir(), "acp-verifier-workspace-")));

    for (const [symlinkPath, targetPath] of Object.entries(this.symlinks)) {
      const symlink = join(workspace.path, symlinkPath);
      const target = relative(dirname(symlink), join(workspace.path, targetPath));
      mkdirSync(dirname(symlink), { recursive: true });
      symlinkSync(target, symlink, "dir");
    }

    return workspace;
  }

  get #dockerBuildContext(): string {
    return resolve(AGENTS_DIR, this.slug);
  }
}

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

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  return parseDotenv(readFileSync(path));
}

function skillMarkdown(name: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\nUse this skill only for ACP verifier tests.\n`;
}
