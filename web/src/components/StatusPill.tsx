import { Tooltip } from "@base-ui/react/tooltip";
import { Typewriter } from "motion-plus/react";
import { useEffect, useState } from "react";

const tooltipPositionerClass =
  "z-50 h-[var(--positioner-height)] w-[var(--positioner-width)] transition-[top,left,right,bottom] duration-150 ease data-[instant]:duration-0";

const statusTooltipClass =
  "z-50 whitespace-nowrap border border-tooltip-border bg-tooltip-bg px-2.5 py-2 text-center text-xs font-medium text-text shadow-[0_8px_24px_rgba(0,0,0,0.5)] [--tooltip-fade-duration:120ms] origin-[var(--transform-origin)] opacity-100 transition-[opacity,transform] duration-[var(--tooltip-fade-duration)] ease data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0";

export default function StatusPill() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setPlay(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Tooltip.Provider delay={0} closeDelay={120} timeout={400}>
      <Tooltip.Root>
        <span className="relative inline-flex">
          <Tooltip.Trigger
            render={
              <span
                className="mt-5 inline-flex cursor-help items-center gap-2 border border-red-border bg-red-bg px-3 py-1.5 text-xs font-semibold tracking-wide text-red uppercase"
                tabIndex={0}
              />
            }
          >
            <span className="h-1.5 w-1.5 bg-red" />
            <span>
              Status:{" "}
              <Typewriter speed="slow" play={play} cursorBlinkRepeat={1}>
                Not Ready
              </Typewriter>
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner className={tooltipPositionerClass} side="bottom" sideOffset={8}>
              <Tooltip.Popup className={statusTooltipClass}>
                80% checks required to pass.
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </span>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
