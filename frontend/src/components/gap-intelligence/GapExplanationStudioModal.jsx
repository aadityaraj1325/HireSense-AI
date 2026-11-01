import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FolderGit2,
  PlusCircle,
  Clock,
  Layers,
  ArrowRight,
  BookOpen,
  Code2,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function GapExplanationStudioModal({
  gap,
  isOpen,
  onClose,
  onSubmitProof,
  onAddToRoadmap,
  isAddingRoadmap,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setActiveTab("overview");
  }, [gap?.id, gap?.skillName]);

  if (!isOpen || !gap) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border border-[var(--border)] bg-[#0d1019] shadow-2xl flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[var(--ink)] tracking-tight">
                  {gap.skillName}
                </h3>
                <Badge
                  variant={
                    gap.priority === "urgent"
                      ? "danger"
                      : gap.priority === "high"
                      ? "warning"
                      : "accent"
                  }
                >
                  {gap.priority?.toUpperCase()} PRIORITY
                </Badge>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                AI Gap Explanation Studio &bull; Grounded Architectural Breakdown
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface-2)] px-6">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "overview"
                ? "border-[var(--accent)] text-[var(--accent-strong)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            <Layers size={14} />
            1. Role &amp; JD Impact
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("evidence")}
            className={cn(
              "py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "evidence"
                ? "border-[var(--accent)] text-[var(--accent-strong)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            <FolderGit2 size={14} />
            2. Platform &amp; Resume Audit
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("learning")}
            className={cn(
              "py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "learning"
                ? "border-[var(--accent)] text-[var(--accent-strong)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            <BookOpen size={14} />
            3. Prereqs &amp; Learning Plan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("proof")}
            className={cn(
              "py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "proof"
                ? "border-[var(--accent)] text-[var(--accent-strong)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            <ShieldCheck size={14} />
            4. Practical Proof &amp; Artifact
          </button>
        </div>

        {/* Studio Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Question 1: Why it matters */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Why this capability matters for the target role
                </div>
                <p className="text-sm text-[var(--ink)] leading-relaxed">
                  {gap.whyItMatters ||
                    gap.reason ||
                    `${gap.skillName} is a standard architectural competency required for day-to-day delivery. Employers assess this during both initial technical screens and systems design interviews.`}
                </p>
              </div>

              {/* Question 2: JD requirement */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Job Description Alignment &amp; Keyword Verification
                </div>
                {gap.isExplicitRequirement ? (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Explicit Requirement Detected</strong>
                      The target job description explicitly lists &ldquo;{gap.skillName}&rdquo; as
                      a required competency. Lacking evidence here directly triggers ATS filter
                      penalties.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                    <CheckCircle2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Implicit / Role Standard Expectation</strong>
                      While not exclusively repeated as a mandatory keyword in the raw JD text, this
                      skill is an expected core standard for this seniority tier.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Question 3: Resume Presentation */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[10px]">
                    3
                  </span>
                  Resume Mention &amp; Presentation Analysis
                </div>
                <p className="text-xs text-[var(--ink-muted)] mb-3">
                  Current resume audit indicates:{" "}
                  <strong className="text-[var(--ink)]">
                    {gap.resumeMentions?.length
                      ? "Mentioned in skills list, but lacking quantified outcome bullets."
                      : "Zero occurrences found in uploaded resume experience or projects."}
                  </strong>
                </p>

                {gap.suggestedBulletPoint && (
                  <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
                      Recommended Resume Bullet (Once Built):
                    </span>
                    <p className="text-xs text-emerald-400 font-mono leading-relaxed">
                      &bull; {gap.suggestedBulletPoint}
                    </p>
                  </div>
                )}
              </div>

              {/* Question 4: Platform Evidence */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[10px]">
                    4
                  </span>
                  Connected Platform Evidence Audit
                </div>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  We checked your connected GitHub repositories, commits, and coding platforms. No
                  verifiable production commits or public repositories directly tagged with &ldquo;
                  {gap.skillName.toLowerCase()}&rdquo; were detected. Submitting a repo below will
                  upgrade your verification level to Level 3.
                </p>
              </div>
            </div>
          )}

          {activeTab === "learning" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Question 5 & 6: Prerequisites and Learning Order */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[10px]">
                    5 &amp; 6
                  </span>
                  Prerequisite Tree &amp; Recommended Learning Sequence
                </div>

                <div className="space-y-3">
                  {gap.prerequisites && gap.prerequisites.length > 0 ? (
                    <div>
                      <div className="text-xs font-semibold text-[var(--ink)] mb-1.5">
                        Prerequisites Required:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gap.prerequisites.map((p) => (
                          <span
                            key={p}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--ink-muted)]">
                      No strict prerequisite blockers. You can dive directly into learning and
                      building.
                    </p>
                  )}

                  <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink-muted)]">
                    <strong className="text-[var(--ink)] block mb-1">
                      Step-by-Step Learning Strategy:
                    </strong>
                    1. Study core mental model and architecture (est. ~4-6 hrs).
                    <br />
                    2. Implement a local proof-of-concept testbench.
                    <br />
                    3. Integrate into an existing or new GitHub repository.
                    <br />
                    4. Submit repository link to HireSense AI for automatic Level 3 verification.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "proof" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Question 7 & 8: Practical Exercise & Project Artifact */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[10px]">
                    7 &amp; 8
                  </span>
                  Suggested Practical Exercise &amp; Project Artifact
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 mb-3">
                  <strong className="block text-emerald-200 font-semibold mb-1">
                    Production Proof Requirement:
                  </strong>
                  {gap.practicalExercise ||
                    `Build and document a full working demonstration repository showcasing ${gap.skillName} with a clean README, build instructions, and automated CI tests.`}
                </div>
                <p className="text-xs text-[var(--ink-muted)]">
                  Artifacts meeting this criteria can be showcased directly in your Proof-of-Work
                  portfolio and referenced in recruiter interviews.
                </p>
              </div>

              {/* Question 9: Verification Process */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] mb-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[10px]">
                    9
                  </span>
                  How to Submit &amp; Verify Evidence
                </div>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  Click &ldquo;Submit Proof&rdquo; below to provide your GitHub repository URL, pull
                  request link, or certification credential. The HireSense evidence engine validates
                  the link, updates your Evidence Coverage Score, and recalibrates your Career
                  Readiness.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer CTAs */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onAddToRoadmap?.(gap.id);
            }}
            disabled={isAddingRoadmap}
            className="text-xs flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            Bridge to Roadmap
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close Studio
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onSubmitProof?.(gap);
              }}
              className="text-xs flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              Submit Proof for this Gap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
