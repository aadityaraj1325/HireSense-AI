import { useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  Sliders,
  CheckSquare,
  Square,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const DEFAULT_SIMULATION_ACTIONS = [
  {
    id: "action_docker_microservice",
    title: "Build and deploy a multi-container Dockerized API",
    category: "project",
    skillsImpacted: ["Docker", "Containers", "DevOps"],
    matchScoreGain: 6,
    evidenceCoverageGain: 12,
    readinessScoreGain: 8,
    estimatedWeeks: 1.5,
  },
  {
    id: "action_cloud_aws",
    title: "Deploy Node/Python backend to AWS ECS/Lambda with IaC",
    category: "cloud",
    skillsImpacted: ["AWS", "Cloud Architecture"],
    matchScoreGain: 8,
    evidenceCoverageGain: 14,
    readinessScoreGain: 10,
    estimatedWeeks: 2,
  },
  {
    id: "action_system_design_repo",
    title: "Publish interactive System Design architectural RFC repository",
    category: "architecture",
    skillsImpacted: ["System Design", "Distributed Systems", "Caching"],
    matchScoreGain: 7,
    evidenceCoverageGain: 15,
    readinessScoreGain: 11,
    estimatedWeeks: 2.5,
  },
  {
    id: "action_leetcode_algorithms",
    title: "Solve 40 LeetCode Mediums across Graphs, DP & Trees",
    category: "algorithms",
    skillsImpacted: ["Data Structures", "Algorithms", "Problem Solving"],
    matchScoreGain: 5,
    evidenceCoverageGain: 10,
    readinessScoreGain: 7,
    estimatedWeeks: 3,
  },
  {
    id: "action_production_ci_cd",
    title: "Setup automated GitHub Actions CI/CD with test coverage badges",
    category: "devops",
    skillsImpacted: ["CI/CD", "Testing", "Automation"],
    matchScoreGain: 4,
    evidenceCoverageGain: 9,
    readinessScoreGain: 6,
    estimatedWeeks: 1,
  },
];

export default function CounterfactualSimulator({
  currentScores = {
    matchScore: 65,
    evidenceCoverageScore: 40,
    overallReadinessScore: 52,
    learningCompletionScore: 35,
  },
  catalogActions = [],
  onSimulate,
  isSimulating,
}) {
  const actions = catalogActions.length > 0 ? catalogActions : DEFAULT_SIMULATION_ACTIONS;
  const [selectedIds, setSelectedIds] = useState([actions[0]?.id || "action_docker_microservice"]);

  const toggleAction = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedActions = useMemo(() => {
    return actions.filter((a) => selectedIds.includes(a.id));
  }, [actions, selectedIds]);

  // Projected Gains
  const projected = useMemo(() => {
    let matchGain = 0;
    let evidenceGain = 0;
    let readinessGain = 0;
    let totalWeeks = 0;

    selectedActions.forEach((a) => {
      matchGain += a.matchScoreGain || 5;
      evidenceGain += a.evidenceCoverageGain || 10;
      readinessGain += a.readinessScoreGain || 8;
      totalWeeks += a.estimatedWeeks || 1.5;
    });

    const newMatch = Math.min(100, (currentScores.matchScore || 0) + matchGain);
    const newEvidence = Math.min(100, (currentScores.evidenceCoverageScore || 0) + evidenceGain);
    const newReadiness = Math.min(100, (currentScores.overallReadinessScore || 0) + readinessGain);

    return {
      matchScore: newMatch,
      evidenceScore: newEvidence,
      readinessScore: newReadiness,
      matchGain,
      evidenceGain,
      readinessGain,
      totalWeeks: Math.round(totalWeeks * 10) / 10,
    };
  }, [selectedActions, currentScores]);

  return (
    <div className="space-y-6">
      {/* Simulator Header & Disclaimer Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)] tracking-tight">
                Career Path Counterfactual Simulator
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                &ldquo;What happens if I learn this?&rdquo; &bull; Dynamic scenario modeling
              </p>
            </div>
          </div>

          <div className="text-xs text-[var(--ink-muted)] flex items-center gap-1.5 font-mono">
            <span>{selectedIds.length} scenario action{selectedIds.length === 1 ? "" : "s"} selected</span>
          </div>
        </div>

        {/* Responsible AI Disclaimer */}
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
          <Info size={15} className="shrink-0 text-blue-400 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Explainable Projection Notice: </strong>
            Simulations calculate rubric coverage increases across verified evidence and target job
            requirements. They do not predict guaranteed hiring outcomes or offer promises.
          </div>
        </div>
      </div>

      {/* Simulated Metrics Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Match Score */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-left space-y-2">
          <div className="text-xs text-[var(--ink-muted)] flex items-center justify-between">
            <span>Target JD Match Score</span>
            {projected.matchGain > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                +{projected.matchGain}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-[var(--ink)]">
              {projected.matchScore}%
            </span>
            <span className="text-xs text-[var(--ink-muted)] line-through">
              {currentScores.matchScore || 0}%
            </span>
          </div>
          <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${projected.matchScore}%` }}
            />
          </div>
        </div>

        {/* Evidence Coverage Score */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-left space-y-2">
          <div className="text-xs text-[var(--ink-muted)] flex items-center justify-between">
            <span>Evidence Coverage</span>
            {projected.evidenceGain > 0 && (
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                +{projected.evidenceGain}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-[var(--ink)]">
              {projected.evidenceScore}%
            </span>
            <span className="text-xs text-[var(--ink-muted)] line-through">
              {currentScores.evidenceCoverageScore || 0}%
            </span>
          </div>
          <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${projected.evidenceScore}%` }}
            />
          </div>
        </div>

        {/* Overall Career Readiness */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-left space-y-2">
          <div className="text-xs text-[var(--ink-muted)] flex items-center justify-between">
            <span>Overall Career Readiness</span>
            {projected.readinessGain > 0 && (
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                +{projected.readinessGain}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-[var(--ink)]">
              {projected.readinessScore}%
            </span>
            <span className="text-xs text-[var(--ink-muted)] line-through">
              {currentScores.overallReadinessScore || 0}%
            </span>
          </div>
          <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${projected.readinessScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Selection Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[var(--ink)]">
            Select Counterfactual Learning Actions to Test
          </h4>
          <span className="text-xs text-[var(--ink-muted)]">
            Estimated timeline: ~{projected.totalWeeks} weeks to execute
          </span>
        </div>

        <div className="space-y-2.5">
          {actions.map((act) => {
            const isSelected = selectedIds.includes(act.id);
            return (
              <div
                key={act.id}
                onClick={() => toggleAction(act.id)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 select-none",
                  isSelected
                    ? "border-purple-500/40 bg-purple-500/5 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                )}
              >
                <div className="mt-0.5 shrink-0 text-purple-400">
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      {act.title}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                      ~{act.estimatedWeeks || 1.5} wks
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(act.skillsImpacted || []).map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-muted)]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 text-right font-mono text-xs text-purple-400 font-semibold">
                  +{act.readinessScoreGain || 8}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

