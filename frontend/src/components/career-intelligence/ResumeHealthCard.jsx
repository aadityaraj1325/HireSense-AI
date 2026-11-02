import React from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowUpRight, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResumeHealthCard({ resumeHealth = {}, activeResume = null }) {
  const atsScore = resumeHealth.atsScore ?? 0;
  const breakdown = resumeHealth.scoreBreakdown || {
    keywords: 0,
    formatting: 0,
    impact: 0,
    clarity: 0,
  };
  const weakSections = resumeHealth.weakSections || [];
  const missingKeywords = resumeHealth.missingKeywords || [];
  const scoreHistory = resumeHealth.scoreHistory || [];

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-7 shadow-card space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[var(--ink)]">
              Resume Intelligence & ATS Health
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Parsed from {activeResume?.title || "Active Resume"}
            </p>
          </div>
        </div>

        <Link
          to={activeResume ? `/resumes/${activeResume.id}` : "/resumes"}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
        >
          <span>Open Studio</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Score and Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="text-[11px] text-[var(--ink-muted)]">Keywords</div>
          <div className="text-lg font-bold text-[var(--ink)] mt-0.5">{breakdown.keywords} <span className="text-xs font-normal text-[var(--ink-muted)]">/ 25</span></div>
        </div>
        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="text-[11px] text-[var(--ink-muted)]">Formatting</div>
          <div className="text-lg font-bold text-[var(--ink)] mt-0.5">{breakdown.formatting} <span className="text-xs font-normal text-[var(--ink-muted)]">/ 25</span></div>
        </div>
        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="text-[11px] text-[var(--ink-muted)]">Impact Metrics</div>
          <div className="text-lg font-bold text-[var(--ink)] mt-0.5">{breakdown.impact} <span className="text-xs font-normal text-[var(--ink-muted)]">/ 25</span></div>
        </div>
        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="text-[11px] text-[var(--ink-muted)]">Clarity</div>
          <div className="text-lg font-bold text-[var(--ink)] mt-0.5">{breakdown.clarity} <span className="text-xs font-normal text-[var(--ink-muted)]">/ 25</span></div>
        </div>
      </div>

      {/* Missing Keywords */}
      {missingKeywords.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <KeyRound size={13} className="text-amber-500" />
            <span>Missing Job-Specific Keywords</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.slice(0, 10).map((kw, i) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium"
              >
                + {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weak sections / detected issues */}
      {weakSections.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <AlertCircle size={13} className="text-rose-500" />
            <span>Detected Weak Sections</span>
          </div>
          <div className="space-y-2">
            {weakSections.slice(0, 3).map((issue, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1">
                <div className="font-semibold text-[var(--ink)]">{issue.title}</div>
                <div className="text-[var(--ink-muted)] text-[11px]">{issue.explanation}</div>
                {issue.fix && (
                  <div className="text-[11px] text-[var(--accent-strong)] font-medium pt-1">
                    Fix: {issue.fix}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

