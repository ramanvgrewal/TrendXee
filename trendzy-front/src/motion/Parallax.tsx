import { createContext, useContext, useRef, type ReactNode } from "react";
import { m, useTransform, type MotionValue } from "framer-motion";
import { usePointer, useRelativePointer } from "@/motion/pointer";

/**
 * Pointer parallax: layers drift a few px against (or with) the pointer, so a
 * composition reads as having depth without 3D or WebGL.
 *
 *   <PointerScope className="…">           ← card / hero region
 *     <Parallax depth={4}>image</Parallax>   ← moves opposite the pointer
 *     <Parallax depth={1} follow>title</Parallax>
 *   </PointerScope>
 *
 * Outside a scope, layers respond to the viewport-wide pointer.
 */
type Scope = { rx: MotionValue<number>; ry: MotionValue<number> };
const ScopeContext = createContext<Scope | null>(null);

export function PointerScope({
  children,
  className = "",
  mode = "hover",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** "hover": tracks while hovered (cards). "viewport": whole screen (hero). */
  mode?: "hover" | "viewport";
  as?: "div" | "section" | "article";
}) {
  const pointer = usePointer();
  if (!pointer.enabled) {
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <ActivePointerScope className={className} mode={mode} as={Tag}>
      {children}
    </ActivePointerScope>
  );
}

function ActivePointerScope({
  children,
  className = "",
  mode = "hover",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  mode?: "hover" | "viewport";
  as?: "div" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const { rx, ry } = useRelativePointer(ref, { mode });
  return (
    <ScopeContext.Provider value={{ rx, ry }}>
      <Tag ref={ref as never} className={className}>
        {children}
      </Tag>
    </ScopeContext.Provider>
  );
}

export function Parallax({
  children,
  depth = 4,
  follow = false,
  rotate = 0,
  bleed = false,
  className = "",
}: {
  children: ReactNode;
  /** Max travel in px at the edge of the scope. Keep 1–5. */
  depth?: number;
  /** Move with the pointer instead of against it (e.g. counter-moving type). */
  follow?: boolean;
  /** Optional max tilt in degrees. Never more than ~1. */
  rotate?: number;
  /** Slightly overscale so moving imagery never reveals its edges. */
  bleed?: boolean;
  className?: string;
}) {
  const scope = useContext(ScopeContext);
  const pointer = usePointer();
  const rx = scope?.rx ?? pointer.nx;
  const ry = scope?.ry ?? pointer.ny;
  const sign = follow ? 1 : -1;

  const x = useTransform(rx, (v) => v * depth * sign);
  const y = useTransform(ry, (v) => v * depth * sign);
  const r = useTransform(rx, (v) => v * rotate);

  if (!pointer.enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={className}
      style={{ x, y, rotate: rotate ? r : undefined, scale: bleed ? 1 + (depth * 2.5) / 100 : undefined }}
    >
      {children}
    </m.div>
  );
}
