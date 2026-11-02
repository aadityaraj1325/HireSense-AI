import { useState, useRef } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  Layers,
  Sparkles,
  Briefcase,
  GraduationCap,
  FolderGit2,
  AlertCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useUploadResume, useFullVersion } from "@/hooks/useResumes";

export function Step1ResumeSelection({
  resumes = [],
  selectedResumeId,
  onSelectResumeId,
  selectedVersionId,
  onSelectVersionId,
  isConfirmed,
  onToggleConfirm,
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const uploadResume = useUploadResume();

  const activeResume = resumes.find((r) => r._id === selectedResumeId) || resumes[0] || null;

  // Retrieve version details if a specific version is selected
  const activeVersionId = selectedVersionId || activeResume?.currentVersionId || null;
  const { data: versionDetail, isLoading: versionLoading } = useFullVersion(
    activeResume?._id,
    activeVersionId
  );

  const parsedData = versionDetail?.parsedSections || activeResume?.parsedData || {};
  const skills = parsedData.skills || [];
  const projects = parsedData.projects || [];
  const experience = parsedData.experience || [];
  const education = parsedData.education || [];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a PDF document format (.pdf)");
      return;
    }

    setUploadError("");
    uploadResume.mutate(
      { file, title: file.name.replace(/\.pdf$/i, "") },
      {
        onSuccess: (data) => {
          if (data.resume?._id) {
            onSelectResumeId(data.resume._id);
            if (data.version?._id) {
              onSelectVersionId(data.version._id);
            }
          }
          setShowUploadModal(false);
        },
        onError: (err) => {
          setUploadError(err?.message || "Failed to parse PDF resume.");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-strong)]">
              Step 1 • Grounding Reference
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mt-0.5">
              Candidate & Resume Selection
            </h2>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              Select the resume that ground your live interview questions, technical probes, and project interrogations.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadResume.isPending}
            className="shrink-0 flex items-center gap-1.5"
          >
            {uploadResume.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Upload New PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {uploadError && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Resumes Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {resumes.map((resume) => {
          const isSelected = (activeResume?._id === resume._id);
          return (
            <div
              key={resume._id}
              onClick={() => {
                onSelectResumeId(resume._id);
                onSelectVersionId(resume.currentVersionId || null);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-[var(--accent-soft)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                  : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-strong)] shrink-0">
                  <FileText size={16} />
                </div>
                {isSelected && (
                  <CheckCircle2 size={18} className="text-[var(--accent-strong)] shrink-0" />
                )}
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-semibold text-[var(--ink)] truncate">
                  {resume.title || "Untitled Resume"}
                </h4>
                <div className="text-xs text-[var(--ink-muted)] mt-1 flex items-center gap-1">
                  <Briefcase size={12} />
                  <span className="truncate">{resume.targetRole || "Software Engineer"}</span>
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] mt-1">
                  Updated {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Resume Extracted Data Preview */}
      {activeResume && (
        <Card padding="md" radius="lg" className="border border-[var(--border)] bg-[var(--surface)]">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent-strong)]" />
                <CardTitle className="text-base">Extracted Candidate Profile</CardTitle>
              </div>
              <span className="text-xs text-[var(--ink-muted)]">
                {skills.length} skills • {projects.length} projects • {experience.length} experiences
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/* Skills Pills */}
            <div>
              <span className="text-xs font-semibold text-[var(--ink-muted)] block mb-1.5 flex items-center gap-1">
                <Layers size={13} /> Extracted Technical Skills:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                {skills.length > 0 ? (
                  skills.slice(0, 24).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)]"
                    >
                      {typeof skill === "string" ? skill : skill.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[var(--ink-muted)] italic">
                    General engineering competencies detected.
                  </span>
                )}
              </div>
            </div>

            {/* Projects Grounding Preview */}
            {projects.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-[var(--ink-muted)] block mb-1.5 flex items-center gap-1">
                  <FolderGit2 size={13} /> Key Built Projects (AI Probing Anchors):
                </span>
                <div className="grid sm:grid-cols-2 gap-2">
                  {projects.slice(0, 4).map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
                    >
                      <div className="font-semibold text-[var(--ink)]">{p.title || p.name || `Project ${idx + 1}`}</div>
                      <div className="text-[11px] text-[var(--ink-muted)] line-clamp-2 mt-0.5">
                        {Array.isArray(p.bullets) ? p.bullets[0] : p.description || "Production project"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation Checkbox */}
            <div className="pt-3 border-t border-[var(--border)] flex items-center gap-3">
              <label
                htmlFor="confirm-resume"
                className="flex items-center gap-2.5 text-xs font-medium text-[var(--ink)] cursor-pointer select-none"
              >
                <input
                  id="confirm-resume"
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => onToggleConfirm(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent-strong)] focus:ring-[var(--accent)] h-4 w-4"
                />
                <span>
                  I confirm that this resume contains my real project experience and technical stack for this interview.
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

