import { useState, useRef, useEffect } from "react";
import Balancer from "react-wrap-balancer";


interface Check {
  slug: string;
  label: string;
  description: string;
  status: string;
}

interface AgentCardProps {
  slug: string;
  name: string;
  company: string;
  checks: Check[];
}

function logoPath(slug: string) {
  const map: Record<string, string> = {
    "claude-code": "claude",
    codex: "openai",
  };
  return `/logos/${map[slug] ?? slug}.svg`;
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function Popover({
  check,
  anchorRef,
  onMouseEnter,
  onMouseLeave,
}: {
  check: Check;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;

    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
    const top = anchorRect.top - popoverRect.height - 8;

    left = Math.max(
      8,
      Math.min(left, window.innerWidth - popoverRect.width - 8),
    );

    setPos({ top: top + window.scrollY, left: left + window.scrollX });
  }, [anchorRef]);

  return (
    <div
      ref={popoverRef}
      className="tooltip-popup"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={
        pos
          ? { position: "absolute", top: pos.top, left: pos.left }
          : { position: "absolute", visibility: "hidden" }
      }
    >
      <div className="flex items-center gap-1.5 font-bold text-sm mb-2.5">
        <span className={`tooltip-icon ${check.status}`}>
          {check.status === "pass" ? (
            <CheckIcon size={12} />
          ) : (
            <XIcon size={12} />
          )}
        </span>
        {check.label}
      </div>
      <Balancer as="div" className="text-xs text-text-dim leading-snug">
        {check.description}
      </Balancer>
      <a
        href={`/checks/${check.slug}`}
        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-text-muted no-underline transition-colors hover:text-text"
      >
        View details &rarr;
      </a>
    </div>
  );
}

function CheckCell({ check }: { check: Check }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <>
      <div
        ref={ref}
        className={`cell ${check.status}`}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
      >
        {check.status === "pass" ? <CheckIcon /> : <XIcon />}
      </div>
      {open && (
        <Popover
          check={check}
          anchorRef={ref}
          onMouseEnter={show}
          onMouseLeave={scheduleClose}
        />
      )}
    </>
  );
}

export default function AgentCard({
  slug,
  name,
  company,
  checks,
}: AgentCardProps) {
  const passed = checks.filter((c) => c.status === "pass").length;
  const pct = Math.round((passed / checks.length) * 100);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 transition-colors hover:border-border-hover">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src={logoPath(slug)} alt={name} className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight leading-tight">
              {name}
            </h2>
            <div className="text-xs text-text-muted mt-0.5">by {company}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold text-text leading-tight">
            {pct}%
          </div>
          <div className="text-xs text-text-muted mt-0.5">passed</div>
        </div>
      </div>
      <div className="check-grid">
        {checks.map((check) => (
          <CheckCell key={check.slug} check={check} />
        ))}
      </div>
    </div>
  );
}
