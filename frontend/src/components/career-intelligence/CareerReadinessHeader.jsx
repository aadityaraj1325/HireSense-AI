import React from "react";
import { Sparkles, RefreshCw, Target, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function CareerReadinessHeader({
  targetRole,
  activeResume,
  readiness,
  onRefresh,
  isRefreshing,
  generatedAt,
}) {
  const overallScore = readiness?.overallScore ?? 0;
  const statusLabel = readiness?.statusLabel ?? "Evaluating";
  const breakdown = readiness?.breakdown ?? {
    resumeHealth: 0,
    developerProof: 0,
    skillCoverage: 0,
    executionProgress: 0,
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 50) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-rose-500 border-rose-500/30 bg-rose-500/10";
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-8 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30 mb-3">
            <Sparkles size={14} />
            <span>Autonomous Career Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--ink)] tracking-tight">
            Career Readiness & Evidence Engine
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-1.5 flex flex-wrap items-center gap-2">
            <span>Targeting: <strong className="text-[var(--ink)] font-semibold">{targetRole}</strong></span>
            {activeResume && (
              <>
                <span>•</span>
                <span>Active Resume: <strong className="text-[var(--ink)] font-semibold">{activeResume.title}</strong></span>
              </>
            )}
            {generatedAt && (
              <>
                <span>•</span>
                <span className="text-xs opacity-80">Synced: {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-sm",
              "bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
            )}
          >
            <RefreshCw size={15} className={cn(isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Analyzing Live Data..." : "Refresh Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Main Readiness Gauge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-6">
        {/* Composite Readiness Card */}
        <div className="sm:col-span-2 lg:col-span-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-muted)]">
            <span>Overall Readiness</span>
            <Target size={15} />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-display font-black text-[var(--ink)]">
              {overallScore}
            </span>
            <span className="text-xs text-[var(--ink-muted)] font-medium">/ 100</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", getScoreColor(overallScore))}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* 1. Resume Health */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 flex flex-col justify-between">
          <div className="text-xs font-medium text-[var(--ink-muted)] flex items-center justify-between">
            <span>Resume ATS Health</span>
            <span className="font-bold text-[var(--ink)]">{breakdown.resumeHealth}%</span>
          </div>
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden my-3">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.resumeHealth}%` }}
            />
          </div>
          <div className="text-[11px] text-[var(--ink-muted)]">
            Keyword density & ATS parsing
          </div>
        </div>

        {/* 2. Developer Proof */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 flex flex-col justify-between">
          <div className="text-xs font-medium text-[var(--ink-muted)] flex items-center justify-between">
            <span>Developer Proof</span>
            <span className="font-bold text-[var(--ink)]">{breakdown.developerProof}%</span>
          </div>
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden my-3">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.developerProof}%` }}
            />
          </div>
          <div className="text-[11px] text-[var(--ink-muted)]">
            GitHub repos, commits & commits streak
          </div>
        </div>

        {/* 3. Skill Coverage */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 flex flex-col justify-between">
          <div className="text-xs font-medium text-[var(--ink-muted)] flex items-center justify-between">
            <span>Skill Coverage</span>
            <span className="font-bold text-[var(--ink)]">{breakdown.skillCoverage}%</span>
          </div>
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden my-3">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.skillCoverage}%` }}
            />
          </div>
          <div className="text-[11px] text-[var(--ink-muted)]">
            Verified vs required role DNA
          </div>
        </div>

        {/* 4. Execution & Milestones */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 flex flex-col justify-between">
          <div className="text-xs font-medium text-[var(--ink-muted)] flex items-center justify-between">
            <span>Execution Progress</span>
            <span className="font-bold text-[var(--ink)]">{breakdown.executionProgress}%</span>
          </div>
          <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden my-3">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.executionProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-[var(--ink-muted)]">
            Roadmap goals & interview rounds
          </div>
        </div>
      </div>
    </div>
  );
}

