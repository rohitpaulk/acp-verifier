import { useRef, useCallback, type ComponentPropsWithoutRef } from "react";

interface CursorGlowCardProps extends ComponentPropsWithoutRef<"div"> {
  glowColor?: string;
  glowImageSrc?: string;
  glowSize?: number;
}

const CARD_CLASS = [
  "group/cursor-glow-card relative bg-border transition-colors duration-[120ms] ease hover:bg-border-hover",
  "[--cursor-glow-x:-999px] [--cursor-glow-y:-999px] [--cursor-glow-size:500px] [--cursor-glow-color:rgba(45,212,104,0.28)]",
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(var(--cursor-glow-size)_circle_at_var(--cursor-glow-x)_var(--cursor-glow-y),var(--cursor-glow-color),transparent_70%)] before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] hover:before:opacity-100",
  "has-[[data-logo-glow]]:before:hidden has-[[data-cell-wrapper]:hover]:z-20 has-[[data-cell-wrapper]:focus-within]:z-20 has-[[data-cell-anchor][data-popup-open]]:z-20",
].join(" ");

const LOGO_GLOW_CLASS =
  "pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover/cursor-glow-card:opacity-100";

const GLOW_IMAGE_CLASS =
  "absolute left-[var(--cursor-glow-x)] top-[var(--cursor-glow-y)] h-[var(--cursor-glow-size)] w-[var(--cursor-glow-size)] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain saturate-[1.1]";

export default function CursorGlowCard({
  glowColor,
  glowImageSrc,
  glowSize,
  className = "",
  style,
  children,
  ...rest
}: CursorGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const { left, top } = el.getBoundingClientRect();
    el.style.setProperty("--cursor-glow-x", `${e.clientX - left}px`);
    el.style.setProperty("--cursor-glow-y", `${e.clientY - top}px`);
  }, []);

  const vars: Record<string, string> = {};
  if (glowColor) vars["--cursor-glow-color"] = glowColor;
  if (glowSize) vars["--cursor-glow-size"] = `${glowSize}px`;

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={`${CARD_CLASS} ${className}`}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {glowImageSrc ? (
        <div className={LOGO_GLOW_CLASS} data-logo-glow="" aria-hidden="true">
          <img
            src={glowImageSrc}
            alt=""
            className={`${GLOW_IMAGE_CLASS} blur-[48px] opacity-[0.14]`}
          />
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-px bg-surface" aria-hidden="true" />
      {glowImageSrc ? (
        <div
          className="pointer-events-none absolute inset-px z-1 overflow-hidden opacity-0 transition-opacity duration-300 group-hover/cursor-glow-card:opacity-100"
          aria-hidden="true"
        >
          <img
            src={glowImageSrc}
            alt=""
            className={`${GLOW_IMAGE_CLASS} blur-[84px] saturate-[1.05] opacity-[0.04]`}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
