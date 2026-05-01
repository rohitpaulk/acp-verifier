import { parse as parseDotenv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  readonly requiredEnvVars: string[];
  readonly env: Record<string, string>;
  readonly symlinks: Record<string, string>;

  constructor(opts: {
    slug: string;
    name: string;
    company: string;
    versionString: string;
    requiredEnvVars: string[];
    env: Record<string, string>;
    symlinks: Record<string, string>;
  }) {
    this.slug = opts.slug;
    this.name = opts.name;
    this.company = opts.company;
    this.versionString = opts.versionString;
    this.requiredEnvVars = opts.requiredEnvVars;
    this.env = opts.env;
    this.symlinks = opts.symlinks;
  }

  static fromDir(dir: string): Agent {
    const agentDir = resolve(AGENTS_DIR, dir);
    const env = loadEnvFile(resolve(agentDir, ".env"));

    const configPath = resolve(agentDir, "agent.yaml");
    const raw = readFileSync(configPath, "utf-8");
    const config = parseYaml(raw) as AgentConfigYAML;

    return new Agent({
      slug: dir,
      name: config.name,
      company: config.company,
      versionString: config.version_string,
      requiredEnvVars: config.env_vars,
      env,
      symlinks: config.symlinks ?? {},
    });
  }

  get imageName(): string {
    return `acp-verifier-${this.slug}`;
  }

  envValue(name: string): string | undefined {
    return this.env[name] ?? process.env[name];
  }

  async buildImage(): Promise<void> {
    const missingEnvVars = this.requiredEnvVars.filter((v) => !this.envValue(v));

    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required env vars for ${this.slug}: ${missingEnvVars.join(", ")}`);
    }

    await CommandRunner.run(`docker build -t ${this.imageName} .`, { logPrefix: `build-${this.slug}` });
  }
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  return parseDotenv(readFileSync(path));
}
