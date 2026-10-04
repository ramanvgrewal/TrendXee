import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { ChevronDown, LogOut, Mail, Bookmark } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeIcon, ThemeToggle, useTheme } from "@/components/ThemeToggle";
import { AuthModal } from "@/components/AuthModal";
import { ContactDialog } from "@/components/ContactDialog";
import { Cta, ctaClass } from "@/components/Cta";
import { Magnetic } from "@/motion/Magnetic";
import { ease, spring } from "@/motion/tokens";
import { businessApiFetch } from "@/lib/api";
import { currentUserQuery, type CurrentUser } from "@/lib/user";
import { aesthetics } from "@/lib/mock-data";
import { laneLabel } from "@/lib/format";

type NavKey = "lanes" | "about" | "archive" | null;

function activeKey(pathname: string): NavKey {
  if (pathname === "/lanes" || pathname.startsWith("/aesthetic/")) return "lanes";
  if (pathname === "/about") return "about";
  if (pathname === "/archive") return "archive";
  return null;
}

/**
 * Sticky header. Transparent and borderless while it sits on top of the
 * page; after ~8px of scroll it gains paper, blur and a hairline. The state
 * flips only when crossing the threshold, never per scroll frame.
 */
export function SiteHeader() {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: user } = useQuery(currentUserQuery);
  const active = activeKey(pathname);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 8;
    if (next !== scrolled) setScrolled(next);
  });

  const handleLogout = async () => {
    await businessApiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    await queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey });
    window.location.reload();
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled
          ? "border-b border-border/70 bg-paper/75 shadow-[0_1px_0_var(--highlight),0_10px_30px_-20px_hsl(var(--shadow-color)/0.45)] backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="TrendXee home">
          <img src="/logo.png" alt="" className="size-8 object-contain transition-transform duration-500 group-hover:-rotate-6" />
          <span className="font-display text-xl tracking-tight">
            Trend<em className="italic text-clay">Xee</em>
          </span>
        </Link>

        {/* Desktop */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <LanesMenu active={active === "lanes"} />
          <NavLink to="/" hash="engine" label="Engine" />
          <NavLink to="/about" label="About" active={active === "about"} />
          <NavLink to="/archive" label="Archive" active={active === "archive"} />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <ProfileMenu user={user} onContact={() => setContactOpen(true)} onLogout={handleLogout} />
          ) : (
            <Cta magnetic>
              <button type="button" onClick={() => setAuthOpen(true)} className={ctaClass("primary", "sm")}>
                Sign in
              </button>
            </Cta>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="relative grid size-10 place-items-center rounded-full text-ink hover:bg-ink/[0.06]"
              >
                <span className="relative block h-3 w-5">
                  <m.span
                    className="absolute left-0 top-0 block h-[1.5px] w-full rounded-full bg-current"
                    animate={menuOpen ? { y: 5.25, rotate: 45 } : { y: 0, rotate: 0 }}
                    transition={spring.tactile}
                  />
                  <m.span
                    className="absolute bottom-0 left-0 block h-[1.5px] w-full rounded-full bg-current"
                    animate={menuOpen ? { y: -5.25, rotate: -45 } : { y: 0, rotate: 0 }}
                    transition={spring.tactile}
                  />
                </span>
              </button>
            </SheetTrigger>
            <MobileMenu
              user={user}
              onNavigate={() => setMenuOpen(false)}
              onSignIn={() => {
                setMenuOpen(false);
                setAuthOpen(true);
              }}
              onContact={() => {
                setMenuOpen(false);
                setContactOpen(true);
              }}
              onLogout={handleLogout}
            />
          </Sheet>
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} user={user} />
    </header>
  );
}

function NavLink({ to, hash, label, active = false }: { to: "/" | "/about" | "/archive"; hash?: string; label: string; active?: boolean }) {
  return (
    <Magnetic max={4}>
      <Link
        to={to}
        hash={hash}
        aria-current={active ? "page" : undefined}
        className={`group/nav relative inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold transition-colors ${
          active ? "text-ink" : "text-ink/70 hover:text-ink"
        }`}
      >
        {active && <ActivePill />}
        <span className="relative">
          {label}
          {!active && (
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-clay transition-transform duration-300 ease-out group-hover/nav:scale-x-100" />
          )}
        </span>
      </Link>
    </Magnetic>
  );
}

function ActivePill() {
  return (
    <m.span
      layoutId="nav-active"
      className="absolute inset-0 rounded-full bg-ink/[0.07] ring-1 ring-ink/10"
      transition={spring.layout}
    />
  );
}

function LanesMenu({ active }: { active: boolean }) {
  return (
    <DropdownMenu modal={false}>
      <Magnetic max={4}>
        <DropdownMenuTrigger
          className={`group/nav relative inline-flex h-9 items-center gap-1 rounded-full px-4 text-[13px] font-semibold outline-none transition-colors data-[state=open]:text-ink ${
            active ? "text-ink" : "text-ink/70 hover:text-ink"
          }`}
        >
          {active && <ActivePill />}
          <span className="relative">Lanes</span>
          <ChevronDown className="relative size-3.5 transition-transform duration-300 group-data-[state=open]/nav:rotate-180" />
        </DropdownMenuTrigger>
      </Magnetic>
      <DropdownMenuContent
        align="start"
        sideOffset={10}
        className="w-[30rem] rounded-2xl border-0 bg-raised p-3 shadow-lift data-[state=open]:duration-200"
      >
        <div className="grid grid-cols-2 gap-1">
          {aesthetics.map((a, i) => (
            <DropdownMenuItem key={a.id} asChild className="rounded-xl p-0 focus:bg-ink/[0.05]">
              <Link to="/aesthetic/$id" params={{ id: a.id }} className="flex items-start gap-3 px-3 py-2.5">
                <span className="mt-0.5 font-mono text-[10px] font-bold text-clay-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block font-display text-lg leading-tight">{laneLabel(a.name)}</span>
                  <span className="block truncate text-[12px] text-ink/70">{a.vibeTags.slice(0, 3).join(" · ")}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="my-2 bg-border" />
        <DropdownMenuItem asChild className="rounded-xl focus:bg-ink/[0.05]">
          <Link to="/lanes" className="flex items-center justify-between px-3 py-2 text-[13px] font-semibold">
            See every lane <span aria-hidden>→</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Avatar({ user, size = "size-7" }: { user: CurrentUser; size?: string }) {
  return user.picture ? (
    <img src={user.picture} alt="" referrerPolicy="no-referrer" className={`${size} rounded-full object-cover`} />
  ) : (
    <span className={`${size} grid place-items-center rounded-full bg-ink font-display text-xs italic text-paper`}>
      {user.name ? user.name.charAt(0).toUpperCase() : "T"}
    </span>
  );
}

function ProfileMenu({ user, onContact, onLogout }: { user: CurrentUser; onContact: () => void; onLogout: () => void }) {
  const { theme, toggle } = useTheme();
  const first = user.name ? user.name.split(" ")[0] : "Profile";
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="group flex h-9 items-center gap-2 rounded-full border border-ink/15 py-1 pl-1 pr-3 text-[13px] font-semibold outline-none transition-colors hover:border-ink/40 data-[state=open]:border-ink/40"
      >
        <Avatar user={user} />
        <span className="max-w-[8rem] truncate">{first}</span>
        <ChevronDown className="size-3.5 text-ink/70 transition-transform duration-300 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl border-0 bg-raised p-2 shadow-lift data-[state=open]:duration-200">
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <Avatar user={user} size="size-9" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.name || "Signed in"}</span>
            <span className="block truncate text-xs text-ink/70">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className="rounded-lg px-2 py-2 focus:bg-ink/[0.05]">
          <Link to="/archive">
            <Bookmark /> Your archive
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg px-2 py-2 focus:bg-ink/[0.05]" onSelect={onContact}>
          <Mail /> Contact us
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-lg px-2 py-2 focus:bg-ink/[0.05]"
          onSelect={(e) => {
            e.preventDefault();
            toggle();
          }}
        >
          <ThemeIcon theme={theme} /> {theme === "dark" ? "Day board" : "Night board"}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem className="rounded-lg px-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={onLogout}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu({
  user,
  onNavigate,
  onSignIn,
  onContact,
  onLogout,
}: {
  user?: CurrentUser;
  onNavigate: () => void;
  onSignIn: () => void;
  onContact: () => void;
  onLogout: () => void;
}) {
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.035, duration: 0.4, ease: ease.drift } }),
  };
  let i = 0;
  return (
    <SheetContent side="right" className="flex w-full flex-col overflow-y-auto border-l border-border bg-raised p-0 ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:duration-200 data-[state=open]:duration-300 sm:max-w-md">
      <SheetTitle className="sr-only">Menu</SheetTitle>
      <div className="flex h-16 items-center px-6 eyebrow text-ink/70">Menu</div>
      <AnimatePresence>
        <nav aria-label="Mobile" className="flex flex-1 flex-col px-6 pb-8">
          <p className="mt-2 eyebrow text-clay-ink">Lanes</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4">
            {aesthetics.map((a, idx) => (
              <m.li key={a.id} custom={i++} variants={item} initial="hidden" animate="show">
                <Link
                  to="/aesthetic/$id"
                  params={{ id: a.id }}
                  onClick={onNavigate}
                  className="flex items-baseline gap-2 border-b border-border py-3 font-display text-2xl active:text-clay"
                >
                  <span className="font-mono text-[10px] font-bold text-clay-ink">{String(idx + 1).padStart(2, "0")}</span>
                  {laneLabel(a.name)}
                </Link>
              </m.li>
            ))}
          </ul>

          <ul className="mt-8 space-y-1">
            {[
              { to: "/lanes" as const, label: "All lanes" },
              { to: "/" as const, hash: "engine", label: "How the engine works" },
              { to: "/about" as const, label: "About TrendXee" },
              { to: "/archive" as const, label: "Your archive" },
            ].map((l) => (
              <m.li key={l.label} custom={i++} variants={item} initial="hidden" animate="show">
                <Link to={l.to} hash={l.hash} onClick={onNavigate} className="block py-2 text-lg font-semibold text-ink/80 active:text-clay">
                  {l.label}
                </Link>
              </m.li>
            ))}
          </ul>

          <m.div custom={i++} variants={item} initial="hidden" animate="show" className="mt-auto pt-10">
            {user ? (
              <div className="rounded-2xl bg-cream/70 p-4 ring-1 ring-border">
                <div className="flex items-center gap-3">
                  <Avatar user={user} size="size-10" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.name || "Signed in"}</p>
                    <p className="truncate text-sm text-ink/70">{user.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={onContact} className={`${ctaClass("outline", "sm")} flex-1`}>
                    Contact
                  </button>
                  <button type="button" onClick={onLogout} className={`${ctaClass("outline", "sm")} flex-1 text-destructive`}>
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={onSignIn} className={`${ctaClass("primary", "lg")} w-full`}>
                Sign in to save trends
              </button>
            )}
          </m.div>
        </nav>
      </AnimatePresence>
    </SheetContent>
  );
}
