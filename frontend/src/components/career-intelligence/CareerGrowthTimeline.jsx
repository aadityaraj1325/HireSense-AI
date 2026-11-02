import React from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowUpRight, CheckCircle2, Clock, Mic, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export function CareerGrowthTimeline({ careerGrowth = {}, activeResume = null }) {
  const milestones = careerGrowth.milestones || [];
  const completedCount = careerGrowth.completedMilestonesCount || 0;
  const totalMilestones = careerGrowth.totalMilestonesCount || 0;
  const interviewsCount = careerGrowth.interviewsCompletedCount || 0;
  const averageInterviewScore = careerGrowth.averageInterviewScore;

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-7 shadow-card space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <Compass size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[var(--ink)]">
              Career Growth & Interview Velocity
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Structured milestone execution & spoken interview readiness
            </p>
          </div>
        </div>

        <Link
          to={activeResume ? `/resumes/${activeResume.id}/roadmap` : "/resumes"}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
        >
          <span>Open Roadmap</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="text-[11px] text-[var(--ink-muted)]">Milestones Cleared</div>
          <div className="text-xl font-bold text-[var(--ink)] mt-1">
            {completedCount} <span className="text-xs font-normal text-[var(--ink-muted)]">/ {totalMilestones || "N/A"}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="text-[11px] text-[var(--ink-muted)]">Interview Simulations</div>
          <div className="text-xl font-bold text-[var(--ink)] mt-1">
            {interviewsCount} {averageInterviewScore && <span className="text-xs text-purple-500 font-semibold">({averageInterviewScore}% avg)</span>}
          </div>
        </div>
      </div>

      {/* Milestone List */}
      {milestones.length > 0 ? (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-semibold text-[var(--ink)]">Active Milestones</div>
          <div className="space-y-2">
            {milestones.slice(0, 4).map((m, idx) => {
              const statusStr = typeof m?.status === "string" ? m.status.toLowerCase() : "planned";
              const isDone = statusStr === "completed";
              const isInProgress = statusStr === "in_progress" || statusStr === "active";

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Clock size={16} className={cn("shrink-0", isInProgress ? "text-amber-500" : "text-[var(--ink-muted)]")} />
                    )}
                    <span className="font-semibold text-[var(--ink)] truncate">
                      {m?.title || m?.name || `Milestone ${idx + 1}`}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0",
                      isDone
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : isInProgress
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-[var(--surface)] text-[var(--ink-muted)] border-[var(--border)]"
                    )}
                  >
                    {statusStr.replace(/_/g, " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center text-xs text-[var(--ink-muted)]">
          No roadmap milestones generated yet. Create a Career Roadmap from your active resume to track step-by-step progress.
        </div>
      )}

      {/* Live Interview Action Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <div className="flex items-center gap-2.5">
          <Radio size={16} className="text-purple-500 animate-pulse" />
          <div className="text-xs font-semibold text-[var(--ink)]">
            Practice Real Spoken Interview
          </div>
        </div>

        <Link
          to="/interview"
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
        >
          Launch Studio
        </Link>
      </div>
    </div>
  );
}

