import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, FileText, ArrowRight, CheckCircle2, GitBranch, ShieldAlert } from "lucide-react";
import { useResumeBridge, useApplyResumeBridge } from "@/hooks/useDeveloperTracker";
import { useResumesList } from "@/hooks/useResumes";

export function ResumeBridgeCard() {
  const { data, isLoading } = useResumeBridge();
  const { data: resumes = [] } = useResumesList();
  const applyMutation = useApplyResumeBridge();

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [editingSuggestion, setEditingSuggestion] = useState(null);
  const [customBullet, setCustomBullet] = useState("");
  const [selectedSection, setSelectedSection] = useState("projects");

  const suggestions = data?.suggestions || [];

  const handleOpenApply = (sug) => {
    setEditingSuggestion(sug);
    setCustomBullet(sug.suggestedBullet);
    setSelectedSection(sug.suggestedSection || "projects");
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0]._id);
    }
  };

  const handleConfirmApply = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !customBullet.trim()) return;

    await applyMutation.mutateAsync({
      resumeId: selectedResumeId,
      suggestionId: editingSuggestion.id,
      customBullet: customBullet.trim(),
      section: selectedSection,
      projectName: editingSuggestion.suggestedProjectName,
    });

    setEditingSuggestion(null);
  };

  return (
    <Card className="border-[var(--border)] overflow-hidden">
      <CardHeader className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[var(--accent)]" size={18} />
            <CardTitle>Smart Activity-to-Resume Bridge</CardTitle>
          </div>
          <Badge tone="accent">Version Control Safe</Badge>
        </div>
        <CardDescription>
          Convert your verified code contributions and problem-solving benchmarks into high-impact, ATS-optimized resume bullets.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[var(--ink-muted)]">
            Scanning verified repositories and benchmarks...
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-2xl space-y-2">
            <p className="text-sm font-semibold text-[var(--ink)]">
              No pending resume bridges
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Connect your GitHub account or reach 25+ solved problems to generate automatic resume bullet suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-5 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral" className="text-[10px] uppercase font-mono">
                      {sug.sourcePlatform}
                    </Badge>
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      {sug.sourceTitle}
                    </span>
                  </div>
                  <Badge tone="success" className="text-[10px] self-start sm:self-auto">
                    Verified Proof
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] font-mono leading-relaxed">
                  "{sug.suggestedBullet}"
                </div>

                <p className="text-xs text-[var(--ink-muted)]">
                  <strong>Why this matters:</strong> {sug.reason}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    Target Section: <span className="text-[var(--ink)] capitalize">{sug.suggestedSection}</span>
                  </span>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenApply(sug)}
                    className="gap-1.5"
                  >
                    Review & Bridge to Resume <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Apply Modal */}
        {editingSuggestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
            <Card className="w-full max-w-xl bg-[var(--surface)] border-[var(--border)] shadow-2xl">
              <CardHeader className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="text-[var(--accent)]" size={16} />
                  <CardTitle className="text-base">
                    Bridge to Resume — Create New Version
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingSuggestion(null)}>
                  ✕
                </Button>
              </CardHeader>

              <form onSubmit={handleConfirmApply} className="p-6 space-y-4">
                {resumes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <div>
                      You do not have any uploaded resumes yet. Please upload a resume first under the <strong>Resumes</strong> tab before applying bullet bridges.
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                        Select Target Resume *
                      </label>
                      <select
                        required
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full h-10 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        {resumes.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.title} (Current: V{r.latestVersionNumber || 1})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                        Resume Section
                      </label>
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full h-10 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 text-xs text-[var(--ink)] focus:outline-none"
                      >
                        <option value="projects">Projects Section</option>
                        <option value="summary">Professional Summary</option>
                        <option value="skills">Skills & Credentials</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                        Editable Bullet Point *
                      </label>
                      <textarea
                        required
                        rows={4}
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        value={customBullet}
                        onChange={(e) => setCustomBullet(e.target.value)}
                      />
                      <span className="text-[10px] text-[var(--ink-muted)] block mt-1">
                        Customize phrasing to match your exact role while maintaining truthful metrics.
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--ink-muted)]">
                      <strong className="text-[var(--ink)]">Version Safety:</strong> Approving this will generate a new immutable version (e.g. V2 / V3) without modifying your original uploaded PDF.
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSuggestion(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={applyMutation.isPending || resumes.length === 0 || !customBullet.trim()}
                  >
                    {applyMutation.isPending ? "Generating Version..." : "Approve & Generate Version"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

