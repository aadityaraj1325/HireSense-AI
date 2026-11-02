import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FileText,
  Target,
  BarChart3,
  Settings,
  LogOut,
  BrainCircuit,
  MessageCircle,
  Code2,
  Mic,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useLiveInterview } from "@/context/LiveInterviewContext";

const NAV = [
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/resumes", icon: FileText, label: "Resumes" },
  { to: "/target", icon: Target, label: "Target" },
  { to: "/career-intelligence", icon: BrainCircuit, label: "AI Career Intelligence" },
  { to: "/interview", icon: Mic, label: "Live Interview Studio" },
  { to: "/developer-tracker", icon: Code2, label: "Developer Tracker" },
];

const ROW_BASE =
  "relative flex items-center h-11 w-[200px] rounded-2xl overflow-hidden " +
  "transition-[background-color,color,box-shadow] duration-200";

const LABEL_BASE =
  "text-[15px] font-medium whitespace-nowrap pr-2";

function NavItem({ to, icon: Icon, label, isLive, targetHref }) {
  const actualTo = targetHref || to;

  return (
    <NavLink to={actualTo} title={label} className="block">
      {({ isActive }) => (
        <div
          className={cn(
            ROW_BASE,
            isActive
              ? "bg-[var(--ink)] text-[var(--bg)] shadow-card"
              : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
          )}
        >
          <span className="h-11 w-11 flex items-center justify-center shrink-0">
            <Icon size={18} strokeWidth={2} />
          </span>
          <span className={LABEL_BASE}>{label}</span>

          {isLive && (
            <span className="ml-auto mr-3 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse shadow-sm">
              LIVE
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

function ActionRow({ icon: Icon, label, onClick, to }) {
  const inner = (isActive) => (
    <div
      className={cn(
        ROW_BASE,
        isActive
          ? "bg-[var(--ink)] text-[var(--bg)] shadow-card"
          : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
      )}
    >
      <span className="h-11 w-11 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </span>
      <span className={LABEL_BASE}>{label}</span>
    </div>
  );

  if (to) {
    return (
      <NavLink to={to} title={label} className="block">
        {({ isActive }) => inner(isActive)}
      </NavLink>
    );
  }

  return (
    <button onClick={onClick} title={label} className="block">
      {inner(false)}
    </button>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { activeSession, hasActiveSession, formattedElapsed } = useLiveInterview();
  const displayName = user?.name || "Account";
  const displayEmail = user?.email || "";

  return (
    <aside
      className={cn(
        "group/sidebar hidden md:flex shrink-0 h-[calc(100vh-32px)] sticky top-4 ml-4",
        "flex-col items-center justify-between py-5 rounded-3xl",
        "bg-[var(--surface)] border border-[var(--border)] shadow-card overflow-hidden",
        "w-[256px]",
      )}
    >
      <div className="flex w-full flex-col items-center gap-6 pt-2">
        <nav className="flex w-[200px] flex-col items-center gap-1.5">
          {NAV.map((item) => {
            const isInterview = item.to === "/interview";
            const isLive = isInterview && hasActiveSession;
            const targetHref = isLive ? `/interview/live/${activeSession.sessionId}` : item.to;

            return (
              <NavItem
                key={item.to}
                {...item}
                isLive={isLive}
                targetHref={targetHref}
              />
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        {/* Persistent Active Live Interview Return Card */}
        {hasActiveSession && (
          <NavLink
            to={`/interview/live/${activeSession.sessionId}`}
            title="Return to Active Interview"
            className="w-[200px] mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-rose-500/15 to-purple-500/15 border border-rose-500/30 hover:border-rose-500 flex items-center justify-between group transition-all shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-bold text-[var(--ink)] leading-none truncate">
                  Return to Interview
                </div>
                <div className="text-[10px] font-mono text-[var(--accent-strong)] mt-0.5">
                  {formattedElapsed}
                </div>
              </div>
            </div>
            <ArrowRight size={13} className="text-[var(--ink-muted)] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </NavLink>
        )}

        <ActionRow icon={MessageCircle} label="Ask HireSense AI" to="/ask-hiresense-ai" />
        <ActionRow icon={Settings} label="Settings" to="/settings" />
        <ActionRow icon={LogOut} label="Log out" onClick={logout} />

        <div
          className={cn(
            "flex items-center h-12 mt-1 w-[200px] overflow-hidden",
          )}
        >
          <div className="h-10 w-10 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold flex items-center justify-center text-sm ring-2 ring-[var(--surface)] shrink-0">
            {user?.name?.[0]?.toUpperCase() || "R"}
          </div>
          <div
            className={cn(
              "ml-3 min-w-0 flex-1",
              "opacity-100",
            )}
          >
            <div className="text-sm font-semibold text-[var(--ink)] truncate">
              {displayName}
            </div>
            {displayEmail && (
              <div className="text-[11px] text-[var(--ink-muted)] truncate">
                {displayEmail}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
