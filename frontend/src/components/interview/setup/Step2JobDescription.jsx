import { useState, useMemo } from "react";
import {
  Briefcase,
  Building2,
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FolderGit2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAnalyzeJd } from "@/hooks/useInterviews";

const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry-Level", sub: "0–1 years" },
  { id: "mid", label: "Mid-Level", sub: "2–4 years" },
  { id: "senior", label: "Senior", sub: "5–7 years" },
  { id: "staff", label: "Staff / Lead", sub: "8+ years" },
];

export function Step2JobDescription({
  targetRole,
  onChangeTargetRole,
  companyName,
  onChangeCompanyName,
  experienceLevel,
  onChangeExperienceLevel,
  jobDescription,
  onChangeJobDescription,
  jobAnalysis,
  onSetJobAnalysis,
  activeResume,
}) {
  const analyzeJd = useAnalyzeJd();

  const handleRunAnalysis = () => {
    if (!jobDescription.trim()) return;
    analyzeJd.mutate(
      { jobDescription, targetRole },
      {
        onSuccess: (data) => {
          if (data.jobAnalysis) {
            onSetJobAnalysis(data.jobAnalysis);
            if (data.jobAnalysis.targetRole && !targetRole) {
              onChangeTargetRole(data.jobAnalysis.targetRole);
            }
            if (data.jobAnalysis.companyName && !companyName) {
              onChangeCompanyName(data.jobAnalysis.companyName);
            }
          }
        },
      }
    );
  };

  // Compute skill overlap between resume and JD
  const skillAnalysis = useMemo(() => {
    const resumeSkills = (activeResume?.parsedData?.skills || []).map((s) =>
      (typeof s === "string" ? s : s.name).toLowerCase()
    );

    const jdRequired = (jobAnalysis?.requiredSkills || []).map((s) => s.trim());
    const jdPreferred = (jobAnalysis?.preferredSkills || []).map((s) => s.trim());
    const allJdSkills = [...jdRequired, ...jdPreferred];

    const demonstrated = [];
    const missing = [];

    for (const skill of allJdSkills) {
      const lower = skill.toLowerCase();
      const match = resumeSkills.some((rs) => rs.includes(lower) || lower.includes(rs));
      if (match) {
        demonstrated.push(skill);
      } else {
        missing.push(skill);
      }
    }

    return {
      demonstrated: [...new Set(demonstrated)],
      missing: [...new Set(missing)],
      totalJdSkills: allJdSkills.length,
    };
  }, [activeResume, jobAnalysis]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-strong)]">
          Step 2 • Role & Requirements
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mt-0.5">
          Job Description & Target Role
        </h2>
        <p className="text-sm text-[var(--ink-muted)] mt-1">
          Specify the role and paste the job description. The AI interviewer will calibrate its questions to probe exact skill gaps and requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Role & Company */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Target Role / Job Title *
              </label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3 top-2.5 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => onChangeTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Engineer"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Company Name (Optional)
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-2.5 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => onChangeCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, OpenAI, HireSense"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Experience Level Selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] block mb-1.5">
              Experience Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const isSelected = experienceLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => onChangeExperienceLevel(lvl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-[var(--accent-soft)] border-[var(--accent)] ring-1 ring-[var(--accent)] text-[var(--ink)]"
                        : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <div className="text-xs font-semibold">{lvl.label}</div>
                    <div className="text-[10px] text-[var(--ink-muted)]">{lvl.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Job Description (Paste or Type)
              </label>
              {jobDescription.length > 20 && (
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={analyzeJd.isPending}
                  className="text-xs text-[var(--accent-strong)] hover:underline flex items-center gap-1 font-medium"
                >
                  {analyzeJd.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  Analyze Requirements
                </button>
              )}
            </div>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => onChangeJobDescription(e.target.value)}
              placeholder="Paste the job posting description here... We will extract technical requirements, responsibilities, and architecture focus areas to simulate the company's real interview questions."
              className="w-full p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono resize-none"
            />
          </div>
        </div>

        {/* Right: Skill Gap & Requirements Intelligence (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="md" radius="lg" className="border border-[var(--border)] bg-[var(--surface)] h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent-strong)]" />
                <CardTitle className="text-base">Role Alignment Preview</CardTitle>
              </div>
              <CardDescription>
                Live comparison between your resume evidence and target job requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {/* Demonstrated Skills */}
              <div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 size={14} /> Skills Demonstrated in Resume ({skillAnalysis.demonstrated.length}):
                </span>
                {skillAnalysis.demonstrated.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {skillAnalysis.demonstrated.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--ink-muted)] italic">
                    Paste a job description and click Analyze to match required skills.
                  </span>
                )}
              </div>

              {/* Missing or Weakly Demonstrated */}
              <div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle size={14} /> Missing Skills (AI Verification Focus):
                </span>
                {skillAnalysis.missing.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {skillAnalysis.missing.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--ink-muted)] italic">
                    {jobAnalysis ? "No obvious skill gaps found." : "Awaiting job description input."}
                  </span>
                )}
              </div>

              {/* Probing Notice */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink-muted)] space-y-1">
                <div className="font-semibold text-[var(--ink)] flex items-center gap-1">
                  <HelpCircle size={13} className="text-[var(--accent-strong)]" />
                  Adaptive Question Strategy
                </div>
                <div>
                  The AI will interrogate verified projects first, then present practical architectural scenarios testing any missing skills.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

