export default function StatusPill() {
  return (
    <span className="status-tooltip-root">
      <span
        className="mt-5 inline-flex cursor-help items-center gap-2 border border-red-border bg-red-bg px-3 py-1.5 text-xs font-semibold tracking-wide text-red uppercase"
        tabIndex={0}
      >
        <span className="h-1.5 w-1.5 bg-red" />
        <span>Status: Not Ready</span>
      </span>
      <span className="tooltip-popup status-tooltip-popup status-tooltip">
        80% checks required to pass.
      </span>
    </span>
  );
}
