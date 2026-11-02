import { useState, useMemo } from "react";
import {
  Layers,
  FileText,
  PenLine,
  CheckCircle2,
  GitCompare,
  Download,
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, relativeTime } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All Versions" },
  { key: "upload", label: "Uploads" },
  { key: "rewrite", label: "AI Rewrites" },
];

export function CVVersionsPanel({
  versions = [],
  activeVersionId,
  onSelectVersion,
  onOpenDiff,
  onExport,
  onCreateVersion,
  resumeTitle = "Resume",
}) {
  const [filter, setFilter] = useState("all");

  const filteredVersions = useMemo(() => {
    // Sort descending so latest version is at the top
    const sorted = [...versions].sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));
    if (filter === "upload") return sorted.filter((v) => v.sourceType === "upload");
    if (filter === "rewrite") return sorted.filter((v) => v.sourceType === "rewrite");
    return sorted;
  }, [versions, filter]);

  const activeVersion = useMemo(
    () => versions.find((v) => v._id === activeVersionId) || versions[versions.length - 1],
    [versions, activeVersionId]
  );

  const uploadsCount = versions.filter((v) => v.sourceType === "upload").length;
  const rewritesCount = versions.filter((v) => v.sourceType === "rewrite").length;

  return (
    <div className="space-y-6">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-2xl bg-[var(--surface-2)] text-[var(--accent-strong)] flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-xs text-[var(--ink-muted)]">Total CV Versions</div>
            <div className="font-display tabular text-2xl font-bold text-[var(--ink)]">
              {versions.length}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-xs text-[var(--ink-muted)]">Active Version</div>
            <div className="font-display tabular text-lg font-bold text-[var(--accent-strong)] truncate">
              {activeVersion?.label || "V1"}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-2xl bg-[var(--surface-2)] text-[var(--ink-muted)] flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-xs text-[var(--ink-muted)]">Original Uploads</div>
            <div className="font-display tabular text-2xl font-bold text-[var(--ink)]">
              {uploadsCount}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-xs text-[var(--ink-muted)]">AI Tailored Rewrites</div>
            <div className="font-display tabular text-2xl font-bold text-purple-600 dark:text-purple-400">
              {rewritesCount}
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] p-1 rounded-full shadow-sm">
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

        {onCreateVersion && (
          <Button
            variant="accent"
            size="sm"
            onClick={onCreateVersion}
            className="gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Sparkles size={13} /> Create Tailored Version
          </Button>
        )}
      </div>

      {/* Version List */}
      <div className="space-y-3.5">
        {filteredVersions.map((v) => {
          const isActive = v._id === activeVersionId;
          const isUpload = v.sourceType === "upload";
          const score = v.latestAnalysisId?.atsScore;
          const targetRole = v.latestAnalysisId?.targetRole || v.parsedSections?.basics?.title;
          const skillsCount = v.parsedSections?.skills?.length || 0;
          const experienceCount = v.parsedSections?.experience?.length || 0;
          const projectsCount = v.parsedSections?.projects?.length || 0;

          return (
            <Card
              key={v._id}
              className={cn(
                "transition-all duration-200 border-2",
                isActive
                  ? "border-[var(--accent)] bg-[var(--surface)] shadow-md"
                  : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)]"
              )}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-2 sm:p-3">
                {/* Left: Version Identity & Metadata */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                      isActive
                        ? "bg-[var(--accent)] text-white shadow-sm"
                        : isUpload
                        ? "bg-[var(--surface-2)] text-[var(--ink-muted)]"
                        : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                    )}
                  >
                    {isUpload ? <FileText size={20} /> : <PenLine size={20} />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-display text-lg font-bold text-[var(--ink)] tabular">
                        {v.label}
                      </span>

                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Current Active Version
                        </span>
                      )}

                      <Badge
                        tone={isUpload ? "neutral" : "accent"}
                        className="text-[11px] capitalize"
                      >
                        {isUpload ? "Original Upload" : "AI Tailored Rewrite"}
                      </Badge>

                      {targetRole && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)]">
                          <Target size={12} /> {targetRole}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {isUpload ? "Uploaded" : "Rewritten"} {relativeTime(v.createdAt)}
                      </span>
                      {skillsCount > 0 && <span>• {skillsCount} skills parsed</span>}
                      {experienceCount > 0 && <span>• {experienceCount} positions</span>}
                      {projectsCount > 0 && <span>• {projectsCount} projects</span>}
                    </div>
                  </div>
                </div>

                {/* Right: ATS Score & Interactive Actions */}
                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                  {score != null ? (
                    <div className="text-right px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                      <div className="font-display tabular text-lg font-bold text-[var(--accent-strong)]">
                        {score} <span className="text-xs text-[var(--ink-muted)] font-normal">/ 100</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">
                        ATS Score
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--ink-muted)] px-2 py-1 rounded-lg bg-[var(--surface-2)]">
                      Not yet scored
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {!isActive ? (
                      <Button
                        type="button"
                        variant="accent"
                        size="sm"
                        onClick={() => onSelectVersion(v._id)}
                        className="text-xs font-semibold"
                      >
                        Set as Active
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-xs opacity-75 font-medium"
                      >
                        Active
                      </Button>
                    )}

                    {onOpenDiff && versions.length >= 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenDiff(v._id)}
                        title="Compare text diff against other versions"
                        className="text-xs gap-1"
                      >
                        <GitCompare size={14} />
                        <span className="hidden sm:inline">Diff</span>
                      </Button>
                    )}

                    {onExport && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onExport(v._id)}
                        title="Export this version as PDF"
                        className="text-xs gap-1"
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Explainer Footer */}
      <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] flex items-start gap-3">
        <Sparkles size={18} className="text-[var(--accent-strong)] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-[var(--ink-muted)]">
          <p className="font-semibold text-[var(--ink)]">How CV Versioning Works in HireSense AI</p>
          <p className="leading-relaxed">
            Every time you upload an updated resume PDF or apply AI bullet rewrites for a target role, a new immutable version is preserved. You can switch between active versions anytime, compare changes in the Diff tab, and export any version directly to PDF.
          </p>
        </div>
      </div>
    </div>
  );
}

