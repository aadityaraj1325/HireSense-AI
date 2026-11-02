import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sun,
  Moon,
  Check,
  History as HistoryIcon,
  Upload,
  Sparkles,
  PenLine,
  ExternalLink,
  ArrowRight,
  BrainCircuit,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/UIContext";
import { useHistory } from "@/hooks/useAnalytics";
import { authApi } from "@/api/auth";
import { cn, relativeTime } from "@/lib/utils";

function FieldLabel({ children }) {
  return (
    <label className="text-xs font-medium text-[var(--ink-muted)] mb-1.5 block">
      {children}
    </label>
  );
}

function ProfileSection() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const dirty = name.trim() !== (user?.name || "") && name.trim().length > 0;

  async function onSave(e) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Couldn't update profile", err?.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="lg" className="max-w-2xl">
      <CardHeader>
        <div>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription className="mt-1">
            Your display name appears on the dashboard greeting and on your resumes.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={onSave} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold flex items-center justify-center text-lg ring-2 ring-[var(--surface)] shrink-0">
            {(user?.name?.[0] || "?").toUpperCase()}
          </div>
          <div className="text-xs text-[var(--ink-muted)]">
            Avatar is generated from your initial.
          </div>
        </div>

        <div>
          <FieldLabel>Full name</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Your name"
          />
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <Input value={user?.email || ""} disabled />
          <p className="text-[11px] text-[var(--ink-muted)] mt-1.5">
            Email changes aren&apos;t supported yet.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ThemeOption({ value, label, icon: Icon, current, onSelect }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "relative flex-1 flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all",
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center",
          active
            ? "bg-[var(--accent-strong)] text-white"
            : "bg-[var(--surface-2)] text-[var(--ink-muted)]"
        )}
      >
        <Icon size={16} />
      </div>
      <div>
        <div className="text-sm font-semibold text-[var(--ink)]">{label}</div>
        <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
          {value === "light" ? "Soft, airy, sage tones" : "Calm, low-glare night"}
        </div>
      </div>
      {active && (
        <span className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[var(--accent-strong)] text-white flex items-center justify-center">
          <Check size={12} />
        </span>
      )}
    </button>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <Card padding="lg" className="max-w-2xl">
      <CardHeader>
        <div>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription className="mt-1">
            Pick a theme. Your choice is remembered on this device.
          </CardDescription>
        </div>
      </CardHeader>

      <div className="flex gap-3">
        <ThemeOption
          value="light"
          label="Light"
          icon={Sun}
          current={theme}
          onSelect={setTheme}
        />
        <ThemeOption
          value="dark"
          label="Dark"
          icon={Moon}
          current={theme}
          onSelect={setTheme}
        />
      </div>
    </Card>
  );
}

function PasswordSection() {
  const toast = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const newTooShort = newPassword.length > 0 && newPassword.length < 8;
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirm === newPassword &&
    !saving;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error("Couldn't change password", err?.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="lg" className="max-w-2xl">
      <CardHeader>
        <div>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription className="mt-1">
            Use at least 8 characters. Mix letters, numbers, and a symbol for a stronger password.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <FieldLabel>Current password</FieldLabel>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div>
          <FieldLabel>New password</FieldLabel>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
          />
          {newTooShort && (
            <p className="text-[11px] text-[var(--danger)] mt-1.5">
              Needs to be at least 8 characters.
            </p>
          )}
        </div>

        <div>
          <FieldLabel>Confirm new password</FieldLabel>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {mismatch && (
            <p className="text-[11px] text-[var(--danger)] mt-1.5">
              Passwords don&apos;t match.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={!canSubmit}>
            {saving ? "Updating..." : "Update password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function HistorySection() {
  const nav = useNavigate();
  const { data, isLoading, error } = useHistory();
  const [filter, setFilter] = useState("all");

  const events = data?.events || [];
  const totals = data?.totals || { all: 0 };

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  const FILTERS = [
    { key: "all", label: "All Activity", icon: HistoryIcon },
    { key: "upload", label: "Uploads", icon: Upload },
    { key: "analyze", label: "Analyses", icon: Sparkles },
    { key: "rewrite", label: "Rewrites", icon: PenLine },
  ];

  const ICONS = {
    upload: Upload,
    analyze: Sparkles,
    rewrite: PenLine,
  };

  const TONES = {
    upload: "neutral",
    analyze: "accent",
    rewrite: "warning",
  };

  return (
    <Card padding="lg" className="max-w-3xl space-y-5">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-0 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon size={18} className="text-[var(--accent)]" />
            <CardTitle className="text-base">Resume & Analysis History</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Chronological audit of all your resume uploads, AI evaluations, and optimizations.
          </CardDescription>
        </div>
      </CardHeader>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const count = totals[f.key] ?? events.length;
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "h-8 px-3 text-xs font-medium rounded-full transition-colors inline-flex items-center gap-1.5",
                isActive
                  ? "bg-[var(--ink)] text-[var(--bg)] font-semibold shadow-sm"
                  : "bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              )}
            >
              <Icon size={12} />
              {f.label}
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  isActive ? "bg-white/20 text-[var(--bg)]" : "bg-[var(--surface)] text-[var(--ink-muted)]"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Activity Content */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 text-xs text-red-300">
          Failed to load history: {error.message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 rounded-2xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--ink-muted)] space-y-2">
          <HistoryIcon size={28} className="mx-auto text-[var(--ink-muted)] opacity-50" />
          <p className="font-semibold text-[var(--ink)]">No activity recorded yet</p>
          <p>Once you upload, evaluate, or optimize resumes, actions will be logged here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
          {filtered.slice(0, 20).map((e) => {
            const Icon = ICONS[e.type] || HistoryIcon;
            return (
              <div
                key={e.id}
                onClick={() => e.resumeId && nav(`/resumes/${e.resumeId}`)}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-3.5 hover:bg-[var(--surface-2)] transition-colors",
                  e.resumeId && "cursor-pointer group"
                )}
              >
                <div className="h-8 w-8 shrink-0 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-muted)] group-hover:text-[var(--accent)]">
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[var(--ink)] truncate group-hover:text-[var(--accent)] flex items-center gap-1">
                    <span>{e.title}</span>
                    {e.resumeId && (
                      <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5 truncate">
                    {e.subtitle}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge tone={TONES[e.type] || "neutral"} className="text-[10px]">
                    {e.label}
                  </Badge>
                  <div className="text-[10px] text-[var(--ink-muted)] mt-1">
                    {relativeTime(e.at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function InsightsSection() {
  const navigate = useNavigate();
  return (
    <Card padding="lg" className="max-w-2xl space-y-4">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <BarChart3 size={18} />
          </div>
          <div>
            <CardTitle className="text-base">Insights & Analytics</CardTitle>
            <CardDescription className="mt-0.5">
              Comprehensive resume score trajectory, ATS benchmarks, and historical analysis.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
        Access detailed analytics on your resume scores over time, category-by-category breakdowns, score velocity, and priority improvement recommendations.
      </p>

      <Button
        type="button"
        onClick={() => navigate("/insights")}
        className="rounded-xl text-xs flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
      >
        <span>Open Dedicated Insights & Analytics Workspace</span>
        <ArrowRight size={14} />
      </Button>
    </Card>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [tab, setTab] = useState(initialTab);

  const handleTabChange = (val) => {
    setTab(val);
    if (val === "profile") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: val });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account profile, look & feel, password, activity history, and analytics."
      />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 flex items-center">
              <HistoryIcon size={14} /> History
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 flex items-center">
              <BarChart3 size={14} /> Insights & Analytics
            </TabsTrigger>
          </TabsList>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/settings/gap-intelligence")}
            className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-strong)] border-[var(--accent)]/40 bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm h-9"
          >
            <BrainCircuit size={15} />
            <span>AI Gap Intelligence Lab</span>
            <ArrowRight size={13} />
          </Button>
        </div>

        <div className="mt-6">
          <TabsContent value="profile">
            <ProfileSection />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceSection />
          </TabsContent>
          <TabsContent value="password">
            <PasswordSection />
          </TabsContent>
          <TabsContent value="history">
            <HistorySection />
          </TabsContent>
          <TabsContent value="insights">
            <InsightsSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
