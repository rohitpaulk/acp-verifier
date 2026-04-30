import { useEffect } from "react";
import { useLocation } from "react-router";

import type { AgentCardProps as Agent } from "../components/AgentCard";
import { CheckPanel } from "../components/CheckPanel";

export function AgentPage({ agent }: { agent: Agent }) {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    const target = document.querySelector(hash);
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
    }
  }, [agent.slug, hash]);

  const sortedChecks = [...agent.checks].sort((a, b) => a.position - b.position);
  const passed = sortedChecks.filter((check) => check.status === "pass").length;
  const failed = sortedChecks.length - passed;

  return (
    <main className="pb-14">
      <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Checks</h2>
          <p className="mt-1 text-sm text-text-muted">
            {passed}/{sortedChecks.length} checks passed
          </p>
        </div>
        <div className="grid grid-cols-3 border border-border bg-surface text-center">
          <div className="px-4 py-2">
            <div className="text-lg font-bold text-text">{sortedChecks.length}</div>
            <div className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              Total
            </div>
          </div>
          <div className="border-l border-border px-4 py-2">
            <div className="text-lg font-bold text-green">{passed}</div>
            <div className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              Passed
            </div>
          </div>
          <div className="border-l border-border px-4 py-2">
            <div className="text-lg font-bold text-red">{failed}</div>
            <div className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              Failed
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {sortedChecks.map((check) => (
          <CheckPanel key={check.slug} check={check} />
        ))}
      </div>
    </main>
  );
}
