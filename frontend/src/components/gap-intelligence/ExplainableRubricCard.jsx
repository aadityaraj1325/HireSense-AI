import { useState } from "react";
import {
  HelpCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExplainableRubricCard({
  scores = {
    matchScore: 68,
    evidenceCoverageScore: 42,
    learningCompletionScore: 35,
    overallReadinessScore: 54,
  },
}) {
  const [showRubricInfo, setShowRubricInfo] = useState(false);

  const metrics = [
    {
      label: "Target JD Match",
      value: scores.matchScore || 0,
      color: "emerald",
      icon: FileText,
      description:
        "Calculated from resume bullet alignment, skill keywords, and relevant target job requirements.",
    },
    {
      label: "Evidence Coverage",
      value: scores.evidenceCoverageScore || 0,
      color: "blue",
      icon: ShieldCheck,
      description:
        "Demonstrated technical proof across connected GitHub repositories, commits, and verified code artifacts.",
    },
    {
      label: "Learning Completion",
      value: scores.learningCompletionScore || 0,
      color: "amber",
      icon: CheckCircle2,
      description:
        "Milestones completed and daily practice tasks tracked on your Career Growth Roadmap.",
    },
    {
      label: "Overall Career Readiness",
      value: scores.overallReadinessScore || 0,
      color: "purple",
      icon: TrendingUp,
      description:
        "Composite explainable index weighting demonstrated evidence (40%), resume match (35%), and roadmap completion (25%).",
    },
  ];

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)] tracking-tight">
            Explainable Career Readiness Rubric
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Transparent scoring separating claimed skills from verified evidence
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRubricInfo(!showRubricInfo)}
          className="flex items-center gap-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          <HelpCircle size={14} />
          <span className="hidden sm:inline">How Scoring Works</span>
          {showRubricInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 4 Score Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon size={14} className="text-[var(--accent)]" />
                  {m.label}
                </span>
                <span className="font-mono font-bold text-[var(--ink)]">{m.value}%</span>
              </div>

              <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    m.color === "emerald"
                      ? "bg-emerald-500"
                      : m.color === "blue"
                      ? "bg-blue-500"
                      : m.color === "amber"
                      ? "bg-amber-500"
                      : "bg-purple-500"
                  )}
                  style={{ width: `${m.value}%` }}
                />
              </div>

              <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                {m.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Explanatory Dropdown Box */}
      {showRubricInfo && (
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold">
            <Info size={14} className="text-blue-400" />
            <span>Rubric Integrity Guarantee</span>
          </div>
          <p className="leading-relaxed">
            HireSense AI does not rely on synthetic random scoring or black-box predictions.
            Every percentage point is grounded in traceable proof:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Resume Match:</strong> Directly measures technical requirement keyword overlap
              between your uploaded resume and the target JD.
            </li>
            <li>
              <strong>Evidence Coverage:</strong> Rewards tangible artifacts (repositories with
              substantive code, commit frequency, algorithmic practice) over unverified declarations.
            </li>
            <li>
              <strong>Readiness Index:</strong> Combines capability depth to prevent resume
              overclaiming while clearly showing how to close remaining gaps.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

