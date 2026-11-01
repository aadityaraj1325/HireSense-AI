import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TARGET_ROLES = [
  "Full Stack Engineer",
  "AI Engineer",
  "Software Engineer",
  "Frontend Engineer",
];

export function ProofOfWorkGraph({ proofOfWorkData, activeRole, onRoleChange }) {
  const [selectedSkill, setSelectedSkill] = useState(null);

  const readiness = proofOfWorkData?.readiness || {};
  const currentRole = activeRole || readiness.targetRole || "Full Stack Engineer";
  const percentage = readiness.readinessPercentage || 0;
  const counts = readiness.counts || {
    demonstrated: 0,
    partial: 0,
    needsPracticalEvidence: 0,
    notDemonstrated: 0,
  };
  const skills = readiness.skills || {
    demonstrated: [],
    partial: [],
    needsPracticalEvidence: [],
    notDemonstrated: [],
  };

  const getStatusBadge = (statusLabel) => {
    switch (statusLabel) {
      case "Verified by supported evidence":
        return <Badge tone="success" className="gap-1"><ShieldCheck size={11} /> Verified</Badge>;
      case "Demonstrated in a project":
        return <Badge tone="accent" className="gap-1">Project Proven</Badge>;
      case "Repeatedly demonstrated":
        return <Badge tone="ink" className="gap-1">Repeated Practice</Badge>;
      default:
        return <Badge tone="neutral" className="gap-1">Practiced</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border-[var(--border)]">
      <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[var(--accent)]" size={20} />
            <CardTitle>Proof-of-Work Career Intelligence</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Transform raw platform commits, solved problems, and contest ratings into demonstrable career evidence.
          </CardDescription>
        </div>

        {/* Target Role Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--ink-muted)] flex items-center gap-1">
            <Target size={13} /> Target Job:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => onRoleChange && onRoleChange(role)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all duration-150",
                  currentRole === role
                    ? "bg-[var(--ink)] text-[var(--bg)] shadow-sm"
                    : "bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Readiness Overview Bar */}
        <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--ink)]">
                Target Role Readiness: {currentRole}
              </span>
              <Badge tone={percentage >= 70 ? "success" : percentage >= 40 ? "warning" : "neutral"}>
                {percentage}% Demonstrated
              </Badge>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">
              Based on verified repositories, algorithmic benchmarks, and focused learning sessions.
            </p>
          </div>

          {/* Quick counts */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-emerald-400 text-sm">{counts.demonstrated}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">Demonstrated</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-amber-400 text-sm">{counts.partial}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">Partial</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-400 text-sm">{counts.needsPracticalEvidence}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">Needs Project</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-[var(--ink-muted)] text-sm">{counts.notDemonstrated}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">Unrecorded</div>
            </div>
          </div>
        </div>

        {/* 4 Categorized Columns */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* 1. Demonstrated Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Demonstrated Skills ({skills.demonstrated.length})
              </span>
            </div>

            <div className="space-y-2">
              {skills.demonstrated.map((item) => (
                <div
                  key={item._id || item.skillName}
                  onClick={() => setSelectedSkill(item)}
                  className="p-3 rounded-xl bg-[var(--surface-2)]/80 border border-emerald-500/30 hover:border-emerald-400/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--ink)] group-hover:text-emerald-400 transition-colors">
                      {item.skillName}
                    </span>
                    <Badge tone="success" className="text-[10px] py-0.5">
                      Lvl {item.evidenceLevel}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                    <span>{item.statusLabel}</span>
                    <span className="font-mono">{item.occurrenceCount} activities</span>
                  </div>
                </div>
              ))}
              {skills.demonstrated.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--ink-muted)]">
                  No verified skills yet. Connect GitHub or LeetCode to populate.
                </div>
              )}
            </div>
          </div>

          {/* 2. Partial Evidence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle size={14} /> Partial Evidence ({skills.partial.length})
              </span>
            </div>

            <div className="space-y-2">
              {skills.partial.map((item) => (
                <div
                  key={item._id || item.skillName}
                  onClick={() => setSelectedSkill(item)}
                  className="p-3 rounded-xl bg-[var(--surface-2)]/80 border border-amber-500/30 hover:border-amber-400/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--ink)] group-hover:text-amber-400 transition-colors">
                      {item.skillName}
                    </span>
                    <Badge tone="warning" className="text-[10px] py-0.5">
                      Lvl {item.evidenceLevel}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                    <span>{item.statusLabel}</span>
                    <span className="font-mono">{item.occurrenceCount} entry</span>
                  </div>
                </div>
              ))}
              {skills.partial.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--ink-muted)]">
                  No partial skills.
                </div>
              )}
            </div>
          </div>

          {/* 3. Needs Practical Evidence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <Sparkles size={14} /> Needs Project Proof ({skills.needsPracticalEvidence.length})
              </span>
            </div>

            <div className="space-y-2">
              {skills.needsPracticalEvidence.map((item) => (
                <div
                  key={item._id || item.skillName}
                  onClick={() => setSelectedSkill(item)}
                  className="p-3 rounded-xl bg-[var(--surface-2)]/80 border border-purple-500/30 hover:border-purple-400/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--ink)] group-hover:text-purple-400 transition-colors">
                      {item.skillName}
                    </span>
                    <Badge tone="accent" className="text-[10px] py-0.5">
                      Theory Known
                    </Badge>
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--ink-muted)] leading-tight">
                    Practiced conceptually, but missing real repository implementation.
                  </p>
                </div>
              ))}
              {skills.needsPracticalEvidence.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--ink-muted)]">
                  All active skills have project backing.
                </div>
              )}
            </div>
          </div>

          {/* 4. Not Yet Demonstrated */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-semibold text-[var(--ink-muted)] flex items-center gap-1.5">
                <HelpCircle size={14} /> Unrecorded ({skills.notDemonstrated.length})
              </span>
            </div>

            <div className="space-y-2">
              {skills.notDemonstrated.map((item) => (
                <div
                  key={item._id || item.skillName}
                  onClick={() => setSelectedSkill(item)}
                  className="p-3 rounded-xl bg-[var(--surface-2)]/40 border border-[var(--border)] hover:border-[var(--ink-muted)] transition-all cursor-pointer group"
                >
                  <span className="text-xs font-medium text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors">
                    {item.skillName}
                  </span>
                  <div className="mt-2 text-[10px] text-[var(--ink-muted)]">
                    Priority: {item.targetRoleRelevance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Evidence Detail Modal / Drawer */}
        {selectedSkill && (
          <div className="mt-6 p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-4 animate-in fade-in-50">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-[var(--ink)]">
                    {selectedSkill.skillName}
                  </h4>
                  {getStatusBadge(selectedSkill.statusLabel)}
                </div>
                <p className="text-xs text-[var(--ink-muted)] mt-1">
                  Category: <span className="capitalize">{selectedSkill.category}</span> · Role Priority: {selectedSkill.targetRoleRelevance}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSkill(null)}>
                Close
              </Button>
            </div>

            {/* Evidence Sources */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[var(--ink)] block">
                Direct Proof & Recorded Artifacts ({selectedSkill.evidenceSources?.length || 0}):
              </span>
              {selectedSkill.evidenceSources?.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedSkill.evidenceSources.map((src, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 pr-3">
                        <div className="font-medium text-[var(--ink)] truncate">
                          [{src.platform}] {src.title}
                        </div>
                        {src.description && (
                          <div className="text-[11px] text-[var(--ink-muted)] truncate">
                            {src.description}
                          </div>
                        )}
                      </div>
                      {src.sourceUrl && (
                        <a
                          href={src.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 p-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
                          title="View verified source artifact"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--ink-muted)] italic">
                  No direct platform activity attached yet. Missing evidence does not imply missing knowledge — you can complete problems or link relevant GitHub repositories.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

