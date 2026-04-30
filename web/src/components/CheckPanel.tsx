import { CheckIcon } from "./CheckIcon";
import { ChevronIcon } from "./ChevronIcon";
import { XIcon } from "./XIcon";
import type { Check } from "./AgentCard";

const checkCardClass =
  "group/check-card scroll-mt-6 border border-border bg-surface transition-colors duration-120 ease hover:border-border-hover hover:bg-surface-hover open:border-border-hover open:bg-surface-hover target:border-text-muted";

const checkSummaryClass =
  "flex min-h-14 cursor-pointer list-none items-center gap-4 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden";

const statusIconClass = (didPass: boolean) =>
  [
    "inline-flex h-6 w-6 shrink-0 items-center justify-center border-[1.5px]",
    didPass ? "border-green-border bg-green-bg text-green" : "border-red-border bg-red-bg text-red",
  ].join(" ");

const statusBadgeClass = (didPass: boolean) =>
  [
    "border px-2 py-1 text-[10px] font-bold leading-none tracking-[0.08em] uppercase",
    didPass ? "border-green-border bg-green-bg text-green" : "border-red-border bg-red-bg text-red",
  ].join(" ");

const detailPanelClass =
  "mt-3.5 border border-border bg-[rgba(11,13,15,0.42)] p-3.5 text-sm leading-[1.55] text-text-dim [&_p]:m-0";

const resultPanelClass = (didPass: boolean) =>
  [
    detailPanelClass,
    didPass ? "border-green-border bg-green-bg" : "border-red-border bg-red-bg",
  ].join(" ");

const detailLabelClass =
  "mb-1.5 text-[0.65rem] font-bold tracking-[0.08em] text-text-muted uppercase";

export function CheckPanel({ check }: { check: Check }) {
  const didPass = check.status === "pass";
  const statusLabel = didPass ? "Passed" : "Failed";

  return (
    <details id={`check-${check.slug}`} className={checkCardClass}>
      <summary className={checkSummaryClass}>
        <span className="flex min-w-0 items-center gap-3">
          <span className={statusIconClass(didPass)} aria-hidden="true">
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
          <span className={statusBadgeClass(didPass)}>{statusLabel}</span>
          <span className="text-text-muted transition-transform duration-120 ease group-open/check-card:rotate-180">
            <ChevronIcon />
          </span>
        </span>
      </summary>
      <div className="border-t border-border px-3.5 pb-3.5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className={detailPanelClass}>
            <div className={detailLabelClass}>Check explanation</div>
            <div
              className="prose prose-invert prose-sm max-w-none prose-a:underline-offset-2 prose-a:decoration-[color-mix(in_srgb,var(--color-green)_50%,transparent)] prose-code:border prose-code:border-border prose-code:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)] prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.78em] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none [--tw-prose-body:var(--color-text-dim)] [--tw-prose-bold:var(--color-text)] [--tw-prose-bullets:var(--color-text-muted)] [--tw-prose-captions:var(--color-text-muted)] [--tw-prose-code:var(--color-text)] [--tw-prose-counters:var(--color-text-muted)] [--tw-prose-headings:var(--color-text)] [--tw-prose-hr:var(--color-border)] [--tw-prose-links:var(--color-green)] [--tw-prose-pre-bg:var(--color-bg)] [--tw-prose-pre-code:var(--color-text)] [--tw-prose-quote-borders:var(--color-border-hover)] [--tw-prose-quotes:var(--color-text-dim)] [--tw-prose-td-borders:var(--color-border)] [--tw-prose-th-borders:var(--color-border-hover)]"
              dangerouslySetInnerHTML={{
                __html: check.explanation_markdown,
              }}
            />
          </div>
          <div className={resultPanelClass(didPass)}>
            <div className={detailLabelClass}>{didPass ? "Result" : "Failure message"}</div>
            <p>{check.message}</p>
          </div>
        </div>
      </div>
    </details>
  );
}
