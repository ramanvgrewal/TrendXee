import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Snowflake } from "lucide-react";
import { usePointer } from "@/motion/pointer";
import { usePrefersReducedMotion } from "@/motion/hooks";
import { useTheme } from "@/components/ThemeToggle";
import { isSnowSeason, readSnowPreference, writeSnowPreference } from "@/lib/snow-season";

/* ── Shared on/off state ──────────────────────────────────────────────────── */

const listeners = new Set<() => void>();
let snowOn: boolean | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}
const getSnapshot = () => (snowOn ??= readSnowPreference());
const getServerSnapshot = () => false;

/**
 * Whether snow may show for this visitor: in season, motion allowed, and not
 * switched off. False on the server and the first client render, so hydration
 * always matches the server HTML.
 */
export function useSnow() {
  const on = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const reduced = usePrefersReducedMotion();
  const [inSeason, setInSeason] = useState(false);
  useEffect(() => setInSeason(isSnowSeason()), []);

  const toggle = useCallback(() => {
    snowOn = !getSnapshot();
    writeSnowPreference(snowOn);
    listeners.forEach((fn) => fn());
  }, []);

  return { available: inSeason && !reduced, on, toggle };
}

/* ── Flakes ───────────────────────────────────────────────────────────────── */

type Flake = {
  x: number;
  y: number;
  /** 0 (far, small, slow) … 1 (near, large, fast). */
  depth: number;
  r: number;
  speed: number;
  swayPhase: number;
  swayRate: number;
  alpha: number;
  /** Near flakes are drawn as six-armed crystals that turn slowly. */
  crystal: boolean;
  angle: number;
  spin: number;
  /** Pointer push, decays back to zero. */
  vx: number;
  vy: number;
};

const MAX_DPR = 2;
const POINTER_RADIUS = 110;

function flakeCount(width: number, height: number) {
  // About one flake per 11,000 px², capped so large screens stay light.
  return Math.round(Math.min(140, Math.max(30, (width * height) / 11000)));
}

function makeFlake(width: number, height: number, anywhere: boolean): Flake {
  const depth = Math.random() ** 1.6; // most flakes are far away
  const crystal = depth > 0.8 && Math.random() < 0.4;
  return {
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : -20 - Math.random() * 60,
    depth,
    r: crystal ? 3.5 + depth * 3 : 0.8 + depth * 2.6,
    speed: 18 + depth * 62 + Math.random() * 10,
    swayPhase: Math.random() * Math.PI * 2,
    swayRate: 0.4 + Math.random() * 0.9,
    alpha: crystal ? 0.7 : 0.35 + depth * 0.55,
    crystal,
    angle: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.8,
    vx: 0,
    vy: 0,
  };
}

/** Soft round flake, rendered once per theme and stamped with drawImage. */
function makeDotSprite(color: string) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${color},1)`);
  grad.addColorStop(0.45, `rgba(${color},0.85)`);
  grad.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/** Six-armed crystal with side branches, rendered once per theme. */
function makeCrystalSprite(color: string, glow: string) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.translate(size / 2, size / 2);
  g.strokeStyle = `rgba(${color},0.95)`;
  g.lineCap = "round";
  g.lineWidth = 2.4;
  g.shadowColor = glow;
  g.shadowBlur = 6;
  const arm = size * 0.4;
  for (let i = 0; i < 6; i++) {
    g.save();
    g.rotate((i * Math.PI) / 3);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -arm);
    for (const t of [0.42, 0.68]) {
      const len = arm * (t === 0.42 ? 0.3 : 0.22);
      g.moveTo(0, -arm * t);
      g.lineTo(-len, -arm * t - len);
      g.moveTo(0, -arm * t);
      g.lineTo(len, -arm * t - len);
    }
    g.stroke();
    g.restore();
  }
  return c;
}

/**
 * Site-wide winter snowfall.
 *
 * One fixed canvas over the page (below dialogs, above content, never
 * catches clicks). Flakes fall at three loose depths with parallax, sway on
 * a gusting wind, drift with page scroll and part around the mouse.
 *
 * Cost: a single requestAnimationFrame loop drawing pre-rendered sprites; it
 * stops while the tab is hidden and is not mounted at all for reduced-motion
 * visitors, out of season, or when switched off.
 */
export function Snowfall() {
  const { available, on } = useSnow();
  if (!available || !on) return null;
  return <SnowCanvas />;
}

function SnowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { x: px, y: py, present, enabled: pointerEnabled } = usePointer();
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dark = theme === "dark";
    // Day board is cream paper, so white would vanish: use a cool winter blue there.
    const color = dark ? "255,255,255" : "122,150,186";
    const glow = dark ? "rgba(200,225,255,0.7)" : "rgba(90,120,160,0.35)";
    const dot = makeDotSprite(color);
    const crystal = makeCrystalSprite(color, glow);

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = flakeCount(width, height);
      flakes = flakes.filter((f) => f.x <= width + 20).slice(0, target);
      while (flakes.length < target) flakes.push(makeFlake(width, height, true));
    };
    resize();

    let lastScroll = window.scrollY;
    let scrollShift = 0;
    const onScroll = () => {
      const y = window.scrollY;
      scrollShift += y - lastScroll;
      lastScroll = y;
    };

    let raf = 0;
    let last = performance.now();
    let time = 0;

    const frame = (now: number) => {
      // Clamp so a long pause (tab switch, debugger) never teleports flakes.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      // Slow gusting wind from two layered waves.
      const wind = Math.sin(time * 0.13) * 18 + Math.sin(time * 0.37 + 1.3) * 9;
      const shift = scrollShift;
      scrollShift = 0;

      const pointerOn = pointerEnabled && present.get() === 1;
      const mx = px.get();
      const my = py.get();

      ctx.clearRect(0, 0, width, height);

      for (const f of flakes) {
        const sway = Math.sin(time * f.swayRate + f.swayPhase) * (8 + f.depth * 14);
        f.x += (wind * (0.4 + f.depth) + sway * 0.6 + f.vx) * dt;
        f.y += (f.speed + f.vy) * dt - shift * (0.15 + f.depth * 0.45);
        f.angle += f.spin * dt;

        if (pointerOn) {
          const dx = f.x - mx;
          const dy = f.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_RADIUS * POINTER_RADIUS && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = (1 - d / POINTER_RADIUS) * 260 * (0.4 + f.depth);
            f.vx += (dx / d) * push * dt;
            f.vy += (dy / d) * push * dt;
          }
        }
        const damping = Math.exp(-2.5 * dt);
        f.vx *= damping;
        f.vy *= damping;

        // Flakes that fall out re-enter at the top; flakes carried off the top
        // by scrolling re-enter at the bottom. The sides wrap around.
        if (f.y > height + 20) Object.assign(f, makeFlake(width, height, false));
        else if (f.y < -100) Object.assign(f, makeFlake(width, height, false), { y: height + Math.random() * 15 });
        if (f.x > width + 20) f.x -= width + 40;
        else if (f.x < -20) f.x += width + 40;

        const size = f.r * 2;
        ctx.globalAlpha = f.alpha;
        if (f.crystal) {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.angle);
          ctx.drawImage(crystal, -size, -size, size * 2, size * 2);
          ctx.restore();
        } else {
          ctx.drawImage(dot, f.x - size, f.y - size, size * 2, size * 2);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || document.hidden) return;
      last = performance.now();
      lastScroll = window.scrollY;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [theme, pointerEnabled, px, py, present]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="snowfall pointer-events-none fixed inset-0 z-[45] h-full w-full"
    />
  );
}

/** Header control: lets visitors switch the snow off (and back on). */
export function SnowToggle({ className = "" }: { className?: string }) {
  const { available, on, toggle } = useSnow();
  if (!available) return null;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Turn off snowfall" : "Turn on snowfall"}
      title={on ? "Stop the snow" : "Let it snow"}
      onClick={toggle}
      className={`grid size-11 place-items-center rounded-full transition-colors hover:bg-ink/[0.06] hover:text-ink ${
        on ? "text-ink/70" : "text-ink/35"
      } ${className}`}
    >
      <span className="relative grid size-4 place-items-center">
        <Snowflake className="size-4" strokeWidth={1.8} aria-hidden />
        {!on && <span aria-hidden className="absolute h-[1.8px] w-5 rotate-45 rounded-full bg-current" />}
      </span>
    </button>
  );
}
