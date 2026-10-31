import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FileText,
  BarChart3,
  Layers,
  History,
  Settings,
  LogOut,
  BrainCircuit,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { to: "/resumes", icon: FileText, label: "Resumes" },
  { to: "/insights", icon: BarChart3, label: "Insights & Analytics" },
  { to: "/versions", icon: Layers, label: "Resume Versions" },
  { to: "/history", icon: History, label: "History" },
  { to: "/interview", icon: BrainCircuit, label: "AI Career Intelligence" },
];

const ROW_BASE =
  "relative flex items-center h-11 w-[200px] rounded-2xl overflow-hidden " +
  "transition-[background-color,color,box-shadow] duration-200";

const LABEL_BASE =
  "text-[15px] font-medium whitespace-nowrap pr-4";

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} title={label} className="block">
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
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        <ActionRow icon={MessageCircle} label="Ask HireSense AI" to="/interview" />
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
