import { CheckIcon } from "./CheckIcon";
import { XIcon } from "./XIcon";
import type { Check } from "./AgentCard";

export function CheckPanel({ check }: { check: Check }) {
  const didPass = check.status === "pass";
  const statusLabel = didPass ? "Passed" : "Failed";

  return (
    <details
      id={`check-${check.slug}`}
      className={`check-card ${didPass ? "check-card-pass" : "check-card-fail"}`}
    >
      <summary className="check-summary">
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`check-status-icon ${didPass ? "pass" : "fail"}`}
            aria-hidden="true"
          >
            {didPass ? <CheckIcon size={13} /> : <XIcon size={13} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-text">
              {check.label}
            </span>
            <span className="block truncate text-xs text-text-muted">#{check.slug}</span>
          </span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <span className={`check-status-badge ${didPass ? "pass" : "fail"}`}>{statusLabel}</span>
          <svg
            className="check-chevron text-text-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="check-body">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="check-detail-panel">
            <div className="check-detail-label">Check explanation</div>
            <div
              className="check-explanation-markdown prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: check.explanation_markdown,
              }}
            />
          </div>
          <div className={`check-detail-panel ${didPass ? "result-pass" : "result-fail"}`}>
            <div className="check-detail-label">{didPass ? "Result" : "Failure message"}</div>
            <p>{check.message}</p>
          </div>
        </div>
      </div>
    </details>
  );
}
