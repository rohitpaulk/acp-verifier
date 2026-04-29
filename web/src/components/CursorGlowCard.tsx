import { useRef, useCallback, type ComponentPropsWithoutRef } from "react";

interface CursorGlowCardProps extends ComponentPropsWithoutRef<"div"> {
  glowColor?: string;
  glowSize?: number;
}

export default function CursorGlowCard({
  glowColor,
  glowSize,
  className = "",
  style,
  children,
  ...rest
}: CursorGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const { left, top } = el.getBoundingClientRect();
      el.style.setProperty("--cursor-glow-x", `${e.clientX - left}px`);
      el.style.setProperty("--cursor-glow-y", `${e.clientY - top}px`);
    },
    [],
  );

  const vars: Record<string, string> = {};
  if (glowColor) vars["--cursor-glow-color"] = glowColor;
  if (glowSize) vars["--cursor-glow-size"] = `${glowSize}px`;

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={`cursor-glow-card ${className}`}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
