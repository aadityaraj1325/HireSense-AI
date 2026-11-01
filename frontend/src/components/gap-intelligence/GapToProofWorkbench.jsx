import { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  FolderGit2,
  Award,
  Globe,
  Code2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const PROOF_TYPES = [
  {
    id: "github_repo",
    label: "GitHub Repository",
    icon: FolderGit2,
    placeholder: "https://github.com/aadityaraj1325/my-docker-api",
    description: "Public or connected repository with code and README documentation.",
  },
  {
    id: "pull_request",
    label: "Merged Pull Request",
    icon: Code2,
    placeholder: "https://github.com/organization/repo/pull/42",
    description: "Merged or open pull request demonstrating architectural changes.",
  },
  {
    id: "certification",
    label: "Verified Certificate",
    icon: Award,
    placeholder: "https://www.credly.com/badges/...",
    description: "Issued credential from AWS, GCP, CKA, Coursera, or accredited body.",
  },
  {
    id: "portfolio_project",
    label: "Live Demo / Project",
    icon: Globe,
    placeholder: "https://my-app.vercel.app",
    description: "Working web application, API endpoint, or production deployment.",
  },
];

export default function GapToProofWorkbench({
  gap,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [evidenceType, setEvidenceType] = useState("github_repo");
  const [title, setTitle] = useState(
    gap ? `${gap.skillName} Proof of Work Implementation` : ""
  );
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (gap?.skillName) {
      setTitle(`${gap.skillName} Proof of Work Implementation`);
      setUrl("");
      setNotes("");
      setValidationError("");
    }
  }, [gap?.id, gap?.skillName]);

  if (!isOpen || !gap) return null;

  const currentTypeConfig =
    PROOF_TYPES.find((t) => t.id === evidenceType) || PROOF_TYPES[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!title.trim()) {
      setValidationError("Please enter an evidence title.");
      return;
    }

    if (url.trim()) {
      try {
        new URL(url);
      } catch (err) {
        setValidationError("Please provide a valid URL (starting with http:// or https://).");
        return;
      }
    }

    onSubmit({
      gapId: gap.id || gap.skillName,
      skillName: gap.skillName,
      type: evidenceType,
      title: title.trim(),
      url: url.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[#0d1019] shadow-2xl flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)] tracking-tight">
                Submit Verifiable Evidence
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Gap-to-Proof Engine &bull; Upgrading{" "}
                <span className="text-[var(--accent-strong)] font-semibold">
                  {gap.skillName}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Proof Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-2">
              Select Evidence Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROOF_TYPES.map((pt) => {
                const Icon = pt.icon;
                const isSelected = evidenceType === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setEvidenceType(pt.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all",
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 text-[var(--ink)] shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:bg-[var(--surface-2)]"
                    )}
                  >
                    <Icon
                      size={16}
                      className={isSelected ? "text-emerald-400 mt-0.5" : "text-[var(--ink-muted)] mt-0.5"}
                    />
                    <div>
                      <div className="text-xs font-semibold">{pt.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] mt-1.5">
              {currentTypeConfig.description}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Evidence Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Dockerized API on GitHub"
              className="w-full h-10 px-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          {/* Proof URL */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Verifiable Link / URL
            </label>
            <div className="relative">
              <LinkIcon
                size={14}
                className="absolute left-3 top-3 text-[var(--ink-muted)]"
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={currentTypeConfig.placeholder}
                className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Implementation Details &amp; Demonstrated Architecture
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Summarize key architectural decisions, test coverage, or technical highlights demonstrated in this artifact..."
              className="w-full p-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Verification Level Preview */}
          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1">
            <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400" />
              Anticipated Verification Tier: Level 3 (Verified Artifact)
            </div>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Submitting verified public code or credentials advances this capability from &ldquo;Not Yet Evidenced&rdquo; to &ldquo;Demonstrated&rdquo; in your Skill DNA.
            </p>
          </div>

          {/* Footer CTAs */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="text-xs flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              {isSubmitting ? "Verifying..." : "Verify & Record Proof"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
