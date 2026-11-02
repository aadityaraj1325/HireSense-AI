import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Code2,
  FileText,
  Mic,
  Compass,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PersonalizedRecommendationsList({ recommendations = [] }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--ink-muted)]">
        <Sparkles className="mx-auto mb-2 text-emerald-500" size={24} />
        All priority milestones and career checks are currently verified.
      </div>
    );
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case "developer":
        return <Code2 size={16} className="text-emerald-500" />;
      case "resume":
        return <FileText size={16} className="text-blue-500" />;
      case "interview":
        return <Mic size={16} className="text-purple-500" />;
      default:
        return <Compass size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-8 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-lg font-display font-bold text-[var(--ink)]">
            Priority Actionable Recommendations
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Autonomous evidence-backed recommendations to accelerate job readiness.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)]">
          {recommendations.length} Actions Identified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const isHigh = rec.priority === "high";

          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-2xl border p-5 flex flex-col justify-between transition-all",
                isHigh
                  ? "border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/50"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/40"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold capitalize text-[var(--ink)]">
                    {getCategoryIcon(rec.category)}
                    <span>{rec.category}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      isHigh
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    )}
                  >
                    {rec.priority} Priority
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[var(--ink)] leading-snug">
                  {rec.title}
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)] space-y-1">
                    <div className="font-semibold text-[var(--ink)] flex items-center gap-1">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <span>Why Generated:</span>
                    </div>
                    <p className="text-[var(--ink-muted)] leading-relaxed">
                      {rec.whyGenerated}
                    </p>
                  </div>

                  <div className="text-[11px] text-[var(--ink-muted)]">
                    <strong className="text-[var(--ink)] font-medium">Supporting User Data:</strong>{" "}
                    {rec.supportingData}
                  </div>

                  <div className="text-[11px] text-[var(--ink-muted)]">
                    <strong className="text-[var(--ink)] font-medium">Recommended Action:</strong>{" "}
                    {rec.actionPlan}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-[var(--border)]/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                  Module: <span className="text-[var(--ink)]">{rec.targetModule}</span>
                </span>

                <Link
                  to={rec.targetUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-strong)] hover:text-[var(--accent)] transition-colors group cursor-pointer"
                >
                  <span>Resolve in {rec.targetModule}</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

