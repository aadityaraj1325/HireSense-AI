import React, { useState } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, Layers, FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SkillIntelligenceMatrix({ skillIntelligence = {} }) {
  const [filter, setFilter] = useState("all");

  const matrix = skillIntelligence.matrix || [];
  const verifiedCount = skillIntelligence.verifiedCount || 0;
  const emergingCount = skillIntelligence.emergingCount || 0;
  const missingCount = skillIntelligence.missingCount || 0;

  const filteredSkills = matrix.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-8 shadow-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-lg font-display font-bold text-[var(--ink)]">
            Skill Intelligence & Evidence Graph
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Real-world practical verification across your repositories, projects, and activities.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl transition-all cursor-pointer",
              filter === "all"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            All ({matrix.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("verified")}
            className={cn(
              "px-3 py-1.5 rounded-xl transition-all cursor-pointer",
              filter === "verified"
                ? "bg-[var(--surface)] text-emerald-500 shadow-sm"
                : "text-[var(--ink-muted)] hover:text-emerald-500"
            )}
          >
            Verified ({verifiedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("emerging")}
            className={cn(
              "px-3 py-1.5 rounded-xl transition-all cursor-pointer",
              filter === "emerging"
                ? "bg-[var(--surface)] text-amber-500 shadow-sm"
                : "text-[var(--ink-muted)] hover:text-amber-500"
            )}
          >
            Emerging ({emergingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("missing")}
            className={cn(
              "px-3 py-1.5 rounded-xl transition-all cursor-pointer",
              filter === "missing"
                ? "bg-[var(--surface)] text-rose-500 shadow-sm"
                : "text-[var(--ink-muted)] hover:text-rose-500"
            )}
          >
            Gaps ({missingCount})
          </button>
        </div>
      </div>

      {/* Grid of skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredSkills.map((s) => {
          const isVerified = s.status === "verified";
          const isEmerging = s.status === "emerging";

          return (
            <div
              key={s.id}
              className={cn(
                "rounded-2xl border p-4 flex flex-col justify-between transition-all",
                isVerified
                  ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                  : isEmerging
                  ? "border-amber-500/30 bg-amber-500/[0.02]"
                  : "border-rose-500/20 bg-rose-500/[0.01]"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-muted)]">
                    {s.category || "Core Skill"}
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-bold",
                      isVerified
                        ? "text-emerald-500"
                        : isEmerging
                        ? "text-amber-500"
                        : "text-rose-500"
                    )}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Verified</span>
                      </>
                    ) : isEmerging ? (
                      <>
                        <HelpCircle size={13} />
                        <span>Emerging</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} />
                        <span>Missing Gap</span>
                      </>
                    )}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-[var(--ink)]">
                  {s.name}
                </h4>

                <p className="text-xs text-[var(--ink-muted)] mt-1.5 leading-relaxed">
                  {s.evidenceSummary}
                </p>
              </div>

              {s.repoCount > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[var(--border)]/50 flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)] font-medium">
                  <FolderGit2 size={13} className="text-[var(--accent)]" />
                  <span>Referenced in {s.repoCount} repository codebases</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

