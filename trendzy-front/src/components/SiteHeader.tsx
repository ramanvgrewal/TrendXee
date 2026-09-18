import { Link } from "@tanstack/react-router";
import { LogOut, Archive } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { businessApiFetch, getGoogleLoginUrl } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthModal } from "@/components/AuthModal";

export function SiteHeader() {
  const queryClient = useQueryClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await businessApiFetch("/api/users/me");
      if (!res.ok) {
        throw new Error("Not authenticated");
      }
      return res.json();
    },
    retry: false,
  });

  const isAuthenticated = !!user;

  const handleLogout = async () => {
    await businessApiFetch("/api/auth/logout", { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center">
            <img src="/logo.png" alt="TrendXee Logo" className="h-8 w-8 object-contain" />
          </span>
          <span className="font-display text-lg tracking-tight">
            Trend<em className="italic text-clay">Xee</em>
          </span>
        </Link>

        <div className="flex items-center gap-5 text-[13px] font-semibold sm:gap-7">
          <Link to="/" hash="engine" className="hidden transition-colors hover:text-clay sm:inline">
            Engine
          </Link>
          <Link to="/about" className="hidden transition-colors hover:text-clay sm:inline">
            About
          </Link>
          <Link to="/archive" className="flex items-center gap-1.5 transition-colors hover:text-clay">
            Archive
          </Link>
          <ThemeToggle />
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              title="Click to logout"
              className="group flex items-center gap-2 rounded-full border border-input py-1 pl-1 pr-4 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all hover:-translate-y-0.5 hover:border-destructive/30 hover:shadow-md"
            >
              {user?.picture ? (
                <img src={user.picture} alt={user?.name || "User"} className="h-7 w-7 rounded-full object-cover group-hover:hidden" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-xs italic text-sand group-hover:hidden">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "T"}
                </span>
              )}
              <div className="hidden h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive group-hover:flex">
                <LogOut className="h-3.5 w-3.5" />
              </div>
              <span className="group-hover:text-destructive">{user?.name ? user.name.split(' ')[0] : "Profile"}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="rounded-full bg-clay px-5 py-2 font-display text-sm italic text-paper transition-all hover:scale-105 hover:bg-clay/90 shadow-md"
            >
              Sign up / Sign in
            </button>
          )}
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
