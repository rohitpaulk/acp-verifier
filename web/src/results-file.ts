export type CheckResult = {
  slug: string;
  position: number;
  label: string;
  explanation_markdown: string;
  status: "pass" | "fail";
  message: string;
};

export type AgentResult = {
  slug: string;
  name: string;
  company: string;
  version_string: string;
  checks: CheckResult[];
};

export type ResultsFileJSON = {
  lastUpdated?: string;
  agents?: Array<{
    slug: string;
    name: string;
    company: string;
    version_string: string;
    checks: Array<{
      slug: string;
      position: number;
      label: string;
      explanation_markdown: string;
      status: string;
      message: string;
    }>;
  }>;
};

export class ResultsFile {
  readonly lastUpdated: string;
  readonly agents: AgentResult[];

  constructor({ lastUpdated, agents }: { lastUpdated: string; agents: AgentResult[] }) {
    this.lastUpdated = lastUpdated;
    this.agents = agents;
  }

  static fromJSON(parsed: ResultsFileJSON): ResultsFile {
    return new ResultsFile({
      lastUpdated: parsed.lastUpdated ?? "",
      agents: (parsed.agents ?? []) as AgentResult[],
    });
  }

  static empty(): ResultsFile {
    return new ResultsFile({ lastUpdated: "", agents: [] });
  }

  merge(partial: ResultsFile): ResultsFile {
    const agentsBySlug = new Map(this.agents.map((agent) => [agent.slug, agent]));

    for (const partialAgent of partial.agents) {
      const existingAgent = agentsBySlug.get(partialAgent.slug);

      agentsBySlug.set(partialAgent.slug, {
        ...existingAgent,
        slug: partialAgent.slug,
        name: partialAgent.name,
        company: partialAgent.company,
        version_string: partialAgent.version_string,
        checks: mergeChecks(existingAgent?.checks ?? [], partialAgent.checks),
      });
    }

    return new ResultsFile({
      lastUpdated: today(),
      agents: [...agentsBySlug.values()],
    });
  }
}

function mergeChecks(existingChecks: CheckResult[], partialChecks: CheckResult[]): CheckResult[] {
  const checksBySlug = new Map(existingChecks.map((check) => [check.slug, check]));

  for (const check of partialChecks) {
    checksBySlug.set(check.slug, check);
  }

  return [...checksBySlug.values()].sort((a, b) => a.position - b.position);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
