import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  FileText,
  History,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  Sun,
  Moon,
  X,
  Code2,
  BrainCircuit,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/IconButton";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useLiveInterview } from "@/context/LiveInterviewContext";
import { NotificationsPopover } from "./NotificationsPopover";
import AILogo from "./AILogo";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/resumes", label: "Resumes", icon: FileText },
  { to: "/target", label: "Target", icon: Target },
  { to: "/career-intelligence", label: "Intelligence", icon: BrainCircuit },
  { to: "/developer-tracker", label: "Dev Tracker", icon: Code2 },
];

export function Topbar({ onOpenPalette }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { activeSession, hasActiveSession, formattedElapsed } = useLiveInterview();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const firstName = user?.name?.split(" ")[0] || "there";
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 -mx-4 sm:-mx-8 lg:-mx-12 px-4 sm:px-8 lg:px-12 bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-[var(--border)]">
        {/* Brand with interactive AI Logo and clean short name badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            title="HireSense AI — Go to Dashboard"
            className="group flex items-center gap-2.5 rounded-2xl p-1 -ml-1 transition-all hover:bg-[var(--surface-2)] active:scale-95 cursor-pointer text-left"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] group-hover:border-[var(--accent)] group-hover:shadow-[0_0_16px_rgba(47,141,70,0.35)] transition-all overflow-hidden">
              <AILogo isInteractive />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-display text-base font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                HireSense
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30 group-hover:bg-[var(--accent)] group-hover:text-white transition-all shadow-sm">
                AI
              </span>
            </div>
          </button>

          {/* Compact non-overlapping user greeting on 2xl+ viewports */}
          <div className="hidden 2xl:flex items-center gap-2 pl-3 border-l border-[var(--border)] text-xs text-[var(--ink-muted)]">
            <span>Hi, <strong className="text-[var(--ink)] font-semibold">{firstName}</strong></span>
          </div>
        </div>

        {/* Center Pill Navigation */}
        <nav className="hidden shrink-0 items-center justify-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 md:flex">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
              isActive ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]",
            )}>
              <Icon size={14} /> <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          {hasActiveSession && (
            <button
              type="button"
              onClick={() => navigate(`/interview/live/${activeSession.sessionId}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer shadow-sm animate-pulse"
              title="Click to return to active live interview"
            >
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="hidden sm:inline">LIVE Session</span>
              <span className="font-mono text-[11px] text-[var(--ink)]">({formattedElapsed})</span>
            </button>
          )}

          <button type="button" onClick={onOpenPalette} className="hidden h-10 w-[190px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-left transition-colors hover:border-[var(--accent)]/40 2xl:flex">
            <Search size={14} className="text-[var(--ink-muted)]" />
            <span className="flex-1 text-xs text-[var(--ink-muted)] truncate">Search your workspace</span>
            <kbd className="text-[10px] text-[var(--ink-muted)] bg-[var(--surface-2)] px-1.5 py-1 rounded-md">{isMac ? "⌘" : "Ctrl"} K</kbd>
          </button>
          <IconButton onClick={onOpenPalette} title="Search" className="2xl:hidden h-10 w-10"><Search size={15} /></IconButton>
          <IconButton onClick={toggle} title="Toggle theme" className="h-10 w-10">{theme === "light" ? <Moon size={15} /> : <Sun size={15} />}</IconButton>
          <NotificationsPopover />
          <div className="relative">
            <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[var(--surface)] transition-colors" aria-expanded={profileOpen}>
              <Avatar name={user?.name} size={32} />
              <ChevronDown size={14} className="hidden sm:block text-[var(--ink-muted)]" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-hover p-2">
                <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                  <div className="text-sm font-semibold truncate">{user?.name || "Account"}</div>
                  <div className="text-xs text-[var(--ink-muted)] truncate">{user?.email}</div>
                </div>
                <button type="button" onClick={() => { navigate("/settings?tab=history"); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-[var(--surface-2)]"><History size={15} /> History</button>
                <button type="button" onClick={() => { navigate("/settings"); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-[var(--surface-2)]"><Settings size={15} /> Settings</button>
                <button type="button" onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left text-[var(--danger)] hover:bg-[var(--surface-2)]"><LogOut size={15} /> Log out</button>
              </div>
            )}
          </div>
          <button type="button" className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl border border-[var(--border)]" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="md:hidden grid grid-cols-2 gap-2 pt-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm", isActive ? "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-[var(--border)] text-[var(--ink-muted)]")}>
              <Icon size={15} /> {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
