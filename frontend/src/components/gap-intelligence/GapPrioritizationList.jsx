import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const DIMENSION_LABELS = {
  technical: "Technical Skill",
  practical_project: "Practical Project",
  problem_solving: "Problem Solving",
  experience: "Relevant Experience",
  portfolio: "Portfolio Evidence",
  resume_presentation: "Resume Presentation",
  interview_prep: "Interview Prep",
  role_knowledge: "Role-Specific Knowledge",
  prerequisite: "Prerequisite Chain",
  jd_keyword: "JD Keyword Alignment",
};

export default function GapPrioritizationList({
  gaps = [],
  onOpenStudio,
  onSubmitProof,
  onAddToRoadmap,
  isAddingRoadmap,
}) {
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dimensionFilter, setDimensionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGaps = useMemo(() => {
    return gaps.filter((gap) => {
      if (priorityFilter !== "all" && gap.priority?.toLowerCase() !== priorityFilter.toLowerCase()) {
        return false;
      }
      if (dimensionFilter !== "all" && gap.dimension !== dimensionFilter) {
        return false;
      }
      if (
        searchQuery &&
        !gap.skillName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !gap.reason?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [gaps, priorityFilter, dimensionFilter, searchQuery]);

  const stats = useMemo(() => {
    const urgent = gaps.filter((g) => g.priority === "urgent").length;
    const high = gaps.filter((g) => g.priority === "high").length;
    const medium = gaps.filter((g) => g.priority === "medium").length;
    const low = gaps.filter((g) => g.priority === "low").length;
    return { urgent, high, medium, low, total: gaps.length };
  }, [gaps]);

  return (
    <div className="space-y-4">
      {/* Priority Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setPriorityFilter(priorityFilter === "urgent" ? "all" : "urgent")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all",
            priorityFilter === "urgent"
              ? "border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ink-muted)]">Urgent Gaps</span>
            <Flame size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{stats.urgent}</div>
          <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">Mandatory in JD / Critical</div>
        </button>

        <button
          type="button"
          onClick={() => setPriorityFilter(priorityFilter === "high" ? "all" : "high")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all",
            priorityFilter === "high"
              ? "border-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ink-muted)]">High Impact</span>
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats.high}</div>
          <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">Direct hiring differentiator</div>
        </button>

        <button
          type="button"
          onClick={() => setPriorityFilter(priorityFilter === "medium" ? "all" : "medium")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all",
            priorityFilter === "medium"
              ? "border-blue-500 bg-blue-500/10"
              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ink-muted)]">Medium Priority</span>
            <Clock size={14} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{stats.medium}</div>
          <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">Secondary / Specialization</div>
        </button>

        <button
          type="button"
          onClick={() => setPriorityFilter(priorityFilter === "low" ? "all" : "low")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all",
            priorityFilter === "low"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ink-muted)]">Low / Nice to Have</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.low}</div>
          <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">Foundational or optional</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-[var(--ink-muted)]" />
          <input
            type="text"
            placeholder="Search gaps, reasons, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--ink-muted)]" />
          <select
            value={dimensionFilter}
            onChange={(e) => setDimensionFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All 10 Gap Dimensions</option>
            {Object.entries(DIMENSION_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gaps List */}
      <div className="space-y-3">
        {filteredGaps.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <Sparkles size={24} className="mx-auto text-[var(--ink-muted)] mb-2" />
            <h4 className="text-sm font-semibold text-[var(--ink)]">No matching gaps found</h4>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          filteredGaps.map((gap) => {
            const isUrgent = gap.priority === "urgent";
            const isHigh = gap.priority === "high";

            return (
              <div
                key={gap.id || gap.skillName}
                className={cn(
                  "group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200",
                  "bg-[var(--surface)] hover:bg-[var(--surface-2)]",
                  isUrgent
                    ? "border-rose-500/30 hover:border-rose-500/60"
                    : isHigh
                    ? "border-amber-500/30 hover:border-amber-500/60"
                    : "border-[var(--border)] hover:border-[var(--accent)]/40"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base text-[var(--ink)] tracking-tight">
                        {gap.skillName}
                      </span>

                      <Badge
                        variant={
                          isUrgent
                            ? "danger"
                            : isHigh
                            ? "warning"
                            : gap.priority === "medium"
                            ? "accent"
                            : "outline"
                        }
                      >
                        {gap.priority?.toUpperCase()} PRIORITY
                      </Badge>

                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--border)]">
                        {DIMENSION_LABELS[gap.dimension] || gap.dimension}
                      </span>

                      {gap.isExplicitRequirement && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Mandatory in Target JD
                        </span>
                      )}

                      {gap.prerequisiteReadiness === "ready" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Prerequisites Ready
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed line-clamp-2">
                      {gap.reason || "High-priority capability required for target job role."}
                    </p>

                    {/* Prerequisite Blocker Note if blocked */}
                    {gap.prerequisiteReadiness === "blocked" && gap.blockedBy?.length > 0 && (
                      <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5 pt-1">
                        <AlertTriangle size={12} />
                        <span>
                          Recommended order: Learn <strong>{gap.blockedBy.join(", ")}</strong> first
                          to build proper foundation.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority Score & Hours */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1 text-right">
                    <div className="text-xs font-mono font-bold text-[var(--accent-strong)]">
                      Score: {gap.priorityScore || 85}/100
                    </div>
                    {gap.estimatedHoursToBridge && (
                      <div className="text-[11px] text-[var(--ink-muted)]">
                        ~{gap.estimatedHoursToBridge} hrs to close
                      </div>
                    )}
                  </div>
                </div>

                {/* Practical Task Preview */}
                {gap.practicalExercise && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[var(--bg)]/50 border border-[var(--border)] text-xs text-[var(--ink-muted)] flex items-start gap-2">
                    <Sparkles size={13} className="text-[var(--accent)] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--ink)]">Suggested Verification Project: </strong>
                      {gap.practicalExercise}
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenStudio?.(gap)}
                      className="text-xs flex items-center gap-1.5 h-8"
                    >
                      <Layers size={13} />
                      AI Studio Deep Dive
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSubmitProof?.(gap)}
                      className="text-xs flex items-center gap-1.5 h-8 hover:text-emerald-400 hover:border-emerald-500/40"
                    >
                      <ShieldCheck size={13} />
                      Submit Proof
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddToRoadmap?.(gap.id)}
                    disabled={isAddingRoadmap}
                    className="text-xs flex items-center gap-1.5 h-8 text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
                  >
                    <PlusCircle size={13} />
                    Add to Roadmap Ladder
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

