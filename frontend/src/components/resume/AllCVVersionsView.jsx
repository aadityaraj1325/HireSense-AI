import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, FileText, PenLine, ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/Input";
import { cn, relativeTime } from "@/lib/utils";
import { useAllVersions } from "@/hooks/useAnalytics";

const FILTERS = [
  { key: "all", label: "All Versions" },
  { key: "upload", label: "Uploads" },
  { key: "rewrite", label: "AI Rewrites" },
];

export function AllCVVersionsView() {
  const nav = useNavigate();
  const { data, isLoading, error } = useAllVersions();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const versions = data?.versions || [];
  const totals = data?.totals || { all: 0, uploads: 0, rewrites: 0 };

  const filtered = useMemo(() => {
    let v = versions;
    if (filter === "upload") v = v.filter((x) => x.sourceType === "upload");
    if (filter === "rewrite") v = v.filter((x) => x.sourceType === "rewrite");
    if (query.trim()) {
      const q = query.toLowerCase();
      v = v.filter(
        (x) =>
          x.resumeTitle?.toLowerCase().includes(q) ||
          x.label?.toLowerCase().includes(q)
      );
    }
    return v;
  }, [versions, filter, query]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-2xl" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[80px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Layers}
        title="Couldn't load versions"
        description={error.message}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <TotalCard label="Total CV Versions" value={totals.all} icon={Layers} />
        <TotalCard label="Original Uploads" value={totals.uploads} icon={FileText} />
        <TotalCard label="AI Rewrites" value={totals.rewrites} icon={PenLine} accent />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] p-1 rounded-full shadow-card">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "h-8 px-3.5 text-xs font-medium rounded-full transition-colors cursor-pointer",
                filter === f.key
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <SearchInput
          className="w-full sm:w-[320px]"
          placeholder="Search resume or version label..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search size={14} />}
        />
      </div>

      {/* List of Versions */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No versions match"
          description={
            versions.length === 0
              ? "Upload a resume on the Resumes tab to start creating versions."
              : "Try a different filter or search term."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <VersionRow
              key={v.id}
              version={v}
              onClick={() => nav(`/resumes/${v.resumeId}?tab=versions`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VersionRow({ version, onClick }) {
  const isUpload = version.sourceType === "upload";
  return (
    <Card onClick={onClick} className="cursor-pointer flex items-center gap-4 hover:border-[var(--accent)] transition-all">
      <div
        className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
          isUpload
            ? "bg-[var(--surface-2)] text-[var(--ink-muted)]"
            : "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
        )}
      >
        {isUpload ? <FileText size={18} /> : <PenLine size={18} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-base font-semibold tabular">
            {version.label}
          </span>
          <span className="text-[var(--ink-muted)] text-sm truncate font-medium">
            {version.resumeTitle}
          </span>
        </div>
        <div className="text-xs text-[var(--ink-muted)] mt-0.5">
          {isUpload ? "Uploaded" : "Rewritten"} {relativeTime(version.createdAt)}
        </div>
      </div>

      {version.score != null ? (
        <div className="text-right shrink-0">
          <div className="font-display tabular text-xl font-semibold text-[var(--accent-strong)]">
            {version.score}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
            ATS Score
          </div>
        </div>
      ) : (
        <Badge tone="neutral">No score</Badge>
      )}

      <Badge tone={isUpload ? "neutral" : "accent"} className="capitalize">
        {isUpload ? "Upload" : "AI Rewrite"}
      </Badge>

      <ChevronRight size={16} className="text-[var(--ink-muted)]" />
    </Card>
  );
}

function TotalCard({ label, value, icon: Icon, accent }) {
  return (
    <Card variant={accent ? "accent" : "default"}>
      <div className="flex items-center gap-3 p-1">
        <div
          className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
            accent
              ? "bg-white/15 text-white"
              : "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
          )}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <div
            className={cn(
              "text-xs",
              accent ? "text-white/70" : "text-[var(--ink-muted)]"
            )}
          >
            {label}
          </div>
          <div className="font-display tabular text-2xl font-semibold tracking-tight">
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}

