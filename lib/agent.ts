import { parse as parseDotenv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import CommandRunner from "./command-runner";
import { build } from "bun";

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

  get #dockerBuildContext(): string {
    return resolve(AGENTS_DIR, this.slug);
  }
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  return parseDotenv(readFileSync(path));
}
