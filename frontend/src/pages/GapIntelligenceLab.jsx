import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  Sparkles,
  GitCompareArrows,
  Layers,
  Sliders,
  Clock,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  PlusCircle,
  FileText,
  Search,
} from "lucide-react";
import { resumesApi } from "@/api/resumes";
import {
  useLatestGapAnalysis,
  useDnaGraph,
  useSimulationCatalog,
  useRunGapAnalysis,
  useSimulateActions,
  useSubmitEvidence,
  useAddGapToRoadmap,
  useAskGapCopilot,
} from "@/hooks/useGapIntelligence";
import SkillDependencyDNAGraph from "@/components/gap-intelligence/SkillDependencyDNAGraph";
import GapPrioritizationList from "@/components/gap-intelligence/GapPrioritizationList";
import GapExplanationStudioModal from "@/components/gap-intelligence/GapExplanationStudioModal";
import CounterfactualSimulator from "@/components/gap-intelligence/CounterfactualSimulator";
import GapToProofWorkbench from "@/components/gap-intelligence/GapToProofWorkbench";
import CareerDigitalTwinTimeline from "@/components/gap-intelligence/CareerDigitalTwinTimeline";
import GapRegressionAlert from "@/components/gap-intelligence/GapRegressionAlert";
import AskGapCopilot from "@/components/gap-intelligence/AskGapCopilot";
import ExplainableRubricCard from "@/components/gap-intelligence/ExplainableRubricCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const STANDARD_ROLES = [
  "Full Stack Engineer",
  "AI Engineer",
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "DevOps / Cloud Engineer",
];

export default function GapIntelligenceLab() {
  const navigate = useNavigate();

  // Selected config states
  const [targetRole, setTargetRole] = useState("Full Stack Engineer");
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [activeTab, setActiveTab] = useState("dna"); // "dna" | "priorities" | "simulator" | "twin" | "copilot"
  const [showJdInput, setShowJdInput] = useState(false);

  // Modals state
  const [studioGap, setStudioGap] = useState(null);
  const [proofGap, setProofGap] = useState(null);

  // Queries
  const { data: latestData, isLoading: isLoadingLatest } = useLatestGapAnalysis();
  const latestAnalysis = latestData?.analysis;

  const { data: dnaData } = useDnaGraph(targetRole);
  const dnaGraph = dnaData?.graph || latestAnalysis?.dnaGraph;

  const { data: catalogData } = useSimulationCatalog();
  const simulationCatalog = catalogData?.actions || [];

  const { data: resumesList } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumesApi.list(),
  });

  // Mutations
  const runAnalysisMutation = useRunGapAnalysis();
  const submitEvidenceMutation = useSubmitEvidence();
  const addToRoadmapMutation = useAddGapToRoadmap();
  const askCopilotMutation = useAskGapCopilot();

  // Sync initial targetRole if latest analysis exists
  useEffect(() => {
    if (latestAnalysis?.targetRole) {
      setTargetRole(latestAnalysis.targetRole);
      if (latestAnalysis.targetJobDescription) {
        setJobDescription(latestAnalysis.targetJobDescription);
      }
    }
  }, [latestAnalysis?.targetRole]);

  // Handle run analysis
  const handleRunAnalysis = () => {
    const roleToAnalyze = (customRoleInput.trim() || targetRole).trim();
    runAnalysisMutation.mutate({
      targetRole: roleToAnalyze,
      targetJobDescription: jobDescription.trim(),
      resumeId: selectedResumeId || undefined,
    });
  };

  // Handle Evidence Submission
  const handleEvidenceSubmit = (evidenceData) => {
    submitEvidenceMutation.mutate(evidenceData, {
      onSuccess: () => {
        setProofGap(null);
      },
    });
  };

  const currentScores = {
    matchScore: latestAnalysis?.matchScore ?? 68,
    evidenceCoverageScore: latestAnalysis?.evidenceCoverageScore ?? 42,
    learningCompletionScore: latestAnalysis?.learningCompletionScore ?? 35,
    overallReadinessScore: latestAnalysis?.overallReadinessScore ?? 54,
  };

  return (
    <div className="relative space-y-6 pb-16">
      {/* Premium Bioluminescent Aurora Atmosphere in Header */}
      <div className="pointer-events-none absolute -top-8 -left-6 -right-6 h-72 overflow-hidden -z-10 opacity-70">
        <div className="absolute -top-16 left-1/6 w-[560px] h-[280px] bg-emerald-500/10 blur-[110px] rounded-full" />
        <div className="absolute -top-10 right-1/4 w-[480px] h-[260px] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[180px] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} />
              Settings
            </button>
            <ChevronRight size={12} />
            <span className="text-[var(--accent-strong)] font-medium">AI Gap Intelligence Lab</span>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <div className="p-2 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30 shadow-[0_0_15px_rgba(47,141,70,0.25)]">
              <BrainCircuit size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                HireSense AI — Gap Intelligence Lab
              </h1>
              <p className="text-xs text-[var(--ink-muted)]">
                Explainable career gap analysis, skill evidence verification, and adaptive career planning
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/settings")}
            className="text-xs"
          >
            Back to Settings
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAnalysis}
            disabled={runAnalysisMutation.isPending}
            className="text-xs flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw
              size={13}
              className={runAnalysisMutation.isPending ? "animate-spin" : ""}
            />
            {runAnalysisMutation.isPending ? "Analyzing Evidence..." : "Run Gap Analysis"}
          </Button>
        </div>
      </div>

      {/* Target Role & Job Description Control Bar */}
      <div className="relative p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl space-y-4 shadow-xl overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-500/30 before:to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Role Selector */}
          <div className="space-y-1.5 flex-1">
            <label className="block text-xs font-semibold text-[var(--ink)]">
              Target Career Role
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {STANDARD_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setTargetRole(role);
                    setCustomRoleInput("");
                  }}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-xl border transition-all select-none font-medium",
                    targetRole === role && !customRoleInput
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Active Resume Selector */}
          <div className="space-y-1.5 sm:w-64">
            <label className="block text-xs font-semibold text-[var(--ink)]">
              Analyzed Resume
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">Latest Uploaded Resume</option>
              {(resumesList?.resumes || resumesList || []).map((r) => (
                <option key={r._id || r.id} value={r._id || r.id}>
                  {r.title || r.fileName || "Resume"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle Custom JD Textarea */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowJdInput(!showJdInput)}
            className="text-xs text-[var(--accent-strong)] hover:underline flex items-center gap-1"
          >
            <FileText size={13} />
            {showJdInput
              ? "Hide Target Job Description"
              : "+ Add Target Job Description (Optional for ATS Keyword Alignment)"}
          </button>

          {showJdInput && (
            <div className="mt-3 space-y-2 animate-in fade-in duration-150">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                placeholder="Paste the job description here. The engine will extract mandatory technical qualifications, compare them with your verified code, and flag keyword alignment gaps..."
                className="w-full p-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              />
              <p className="text-[11px] text-[var(--ink-muted)]">
                Job descriptions are parsed locally and cross-referenced with your verified evidence.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Regression Alert Banner if Present */}
      {latestAnalysis?.regressionNotice && (
        <GapRegressionAlert regressionNotice={latestAnalysis.regressionNotice} />
      )}

      {/* Transparent Explainable Rubric Scores */}
      <ExplainableRubricCard scores={currentScores} />

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-[var(--border)] bg-[var(--surface)] rounded-2xl p-1 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("dna")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all select-none shrink-0",
            activeTab === "dna"
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-sm"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
          )}
        >
          <Layers size={15} />
          Skill Dependency DNA Graph
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("priorities")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all select-none shrink-0",
            activeTab === "priorities"
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-sm"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
          )}
        >
          <Sparkles size={15} />
          Prioritized Gaps ({latestAnalysis?.gaps?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("simulator")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all select-none shrink-0",
            activeTab === "simulator"
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-sm"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
          )}
        >
          <Sliders size={15} />
          Counterfactual Simulator
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("twin")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all select-none shrink-0",
            activeTab === "twin"
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-sm"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
          )}
        >
          <Clock size={15} />
          Career Digital Twin
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("copilot")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all select-none shrink-0",
            activeTab === "copilot"
              ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-sm"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
          )}
        >
          <BrainCircuit size={15} />
          Ask Gap Intelligence AI
        </button>
      </div>

      {/* Main Tab Content Panes */}
      <div className="transition-all">
        {activeTab === "dna" && (
          <SkillDependencyDNAGraph
            dnaGraph={dnaGraph}
            selectedRole={targetRole}
            onSelectGap={(gap) => setStudioGap(gap)}
            onSubmitProof={(gap) => setProofGap(gap)}
            onAddToRoadmap={(gapId) => addToRoadmapMutation.mutate(gapId)}
          />
        )}

        {activeTab === "priorities" && (
          <GapPrioritizationList
            gaps={latestAnalysis?.gaps || []}
            onOpenStudio={(gap) => setStudioGap(gap)}
            onSubmitProof={(gap) => setProofGap(gap)}
            onAddToRoadmap={(gapId) => addToRoadmapMutation.mutate(gapId)}
            isAddingRoadmap={addToRoadmapMutation.isPending}
          />
        )}

        {activeTab === "simulator" && (
          <CounterfactualSimulator
            currentScores={currentScores}
            catalogActions={simulationCatalog}
            onSimulate={() => {}}
            isSimulating={false}
          />
        )}

        {activeTab === "twin" && (
          <CareerDigitalTwinTimeline timeline={latestAnalysis?.twinAuditTimeline || []} />
        )}

        {activeTab === "copilot" && (
          <AskGapCopilot
            onAsk={(q) => askCopilotMutation.mutateAsync(q)}
            isAsking={askCopilotMutation.isPending}
          />
        )}
      </div>

      {/* Modals */}
      <GapExplanationStudioModal
        gap={studioGap}
        isOpen={Boolean(studioGap)}
        onClose={() => setStudioGap(null)}
        onSubmitProof={(gap) => setProofGap(gap)}
        onAddToRoadmap={(gapId) => addToRoadmapMutation.mutate(gapId)}
        isAddingRoadmap={addToRoadmapMutation.isPending}
      />

      <GapToProofWorkbench
        gap={proofGap}
        isOpen={Boolean(proofGap)}
        onClose={() => setProofGap(null)}
        onSubmit={handleEvidenceSubmit}
        isSubmitting={submitEvidenceMutation.isPending}
      />
    </div>
  );
}

