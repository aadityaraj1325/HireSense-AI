import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Activity,
  Plus,
  GitCommit,
  GitPullRequest,
  FolderGit2,
  CheckCircle,
  Trophy,
  Clock,
  BookOpen,
  ExternalLink,
  Trash2,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { useDeveloperActivities, useCreateManualActivity } from "@/hooks/useDeveloperTracker";
import { relativeTime } from "@/lib/utils";

const TYPE_ICONS = {
  commit: GitCommit,
  pull_request: GitPullRequest,
  repo_created: FolderGit2,
  problem_solved: CheckCircle,
  contest: Trophy,
  focus_session: Clock,
  learning_task: BookOpen,
  certification: Trophy,
  manual_activity: Activity,
};

export function ActivityTimeline({ selectedDate, onClearDateFilter }) {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual activity form state
  const [manualTitle, setManualTitle] = useState("");
  const [manualPlatform, setManualPlatform] = useState("manual");
  const [manualType, setManualType] = useState("learning_task");
  const [manualDescription, setManualDescription] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualSkills, setManualSkills] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualDate, setManualDate] = useState(selectedDate || new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useDeveloperActivities({
    platform: platformFilter,
    type: typeFilter,
    date: selectedDate || undefined,
  });

  const createMutation = useCreateManualActivity();

  const activities = data?.activities || [];
  const dailySummary = data?.dailySummary || "";

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    let cleanUrl = manualUrl.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    await createMutation.mutateAsync({
      title: manualTitle.trim(),
      platform: manualPlatform,
      activityType: manualType,
      description: manualDescription.trim(),
      sourceUrl: cleanUrl,
      skillTags: manualSkills.split(",").map((s) => s.trim()).filter(Boolean),
      durationMinutes: Number(manualDuration) || 0,
      date: manualDate || new Date().toISOString().slice(0, 10),
    });

    setManualTitle("");
    setManualDescription("");
    setManualUrl("");
    setManualSkills("");
    setManualDuration("");
    setManualDate(selectedDate || new Date().toISOString().slice(0, 10));
    setShowManualModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Daily Summary Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[var(--surface-2)] to-purple-950/30 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} /> My Daily Developer Summary
          </div>
          <p className="text-sm font-medium text-[var(--ink)]">
            {dailySummary}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setManualDate(selectedDate || new Date().toISOString().slice(0, 10));
            setShowManualModal(true);
          }}
          className="gap-1.5 shrink-0"
        >
          <Plus size={14} /> Log Manual Activity
        </Button>
      </div>

      {/* Main Timeline Card */}
      <Card className="border-[var(--border)]">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="text-[var(--accent)]" size={18} />
              <CardTitle>My Daily Coding Activity</CardTitle>
            </div>
            <CardDescription>
              Chronological proof-of-work feed across commits, problem solves, contests, and deep work.
            </CardDescription>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedDate && (
              <Badge tone="accent" className="gap-1 pr-1.5">
                <Calendar size={12} /> {selectedDate}
                <button
                  type="button"
                  onClick={onClearDateFilter}
                  className="ml-1 hover:text-white"
                >
                  ✕
                </button>
              </Badge>
            )}

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="h-8 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink)] focus:outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="github">GitHub</option>
              <option value="leetcode">LeetCode</option>
              <option value="codeforces">Codeforces</option>
              <option value="focus_timer">Focus Timer</option>
              <option value="manual">Manual Logs</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink)] focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="commit">Commits</option>
              <option value="problem_solved">Problems Solved</option>
              <option value="contest">Contests</option>
              <option value="focus_session">Focus Sessions</option>
              <option value="pull_request">Pull Requests</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[var(--ink-muted)]">
              Loading activity timeline...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-[var(--border)] rounded-2xl">
              <p className="text-sm font-semibold text-[var(--ink)]">No activities found</p>
              <p className="text-xs text-[var(--ink-muted)]">
                Connect your developer accounts or log a manual coding session above.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-[var(--border)]">
              {activities.map((act) => {
                const Icon = TYPE_ICONS[act.activityType] || Activity;
                return (
                  <div key={act._id} className="relative group">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-6 top-1.5 h-5 w-5 rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform">
                      <Icon size={11} />
                    </div>

                    {/* Activity Item Card */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral" className="text-[10px] uppercase font-mono">
                            {act.platform}
                          </Badge>
                          <span className="text-sm font-semibold text-[var(--ink)]">
                            {act.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                          <span>{relativeTime(act.timestamp || act.activityDate)}</span>
                          {act.verified && (
                            <Badge tone="success" className="text-[10px] py-0.5 gap-1">
                              <ShieldCheck size={10} /> Verified
                            </Badge>
                          )}
                          {act.isManual && (
                            <Badge tone="neutral" className="text-[10px] py-0.5">
                              Manual
                            </Badge>
                          )}
                        </div>
                      </div>

                      {act.description && (
                        <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                          {act.description}
                        </p>
                      )}

                      {/* Tags & Action Link */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-1">
                          {(act.skillTags || []).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[10px] text-[var(--ink)] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {act.sourceUrl && (
                          <a
                            href={act.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                          >
                            Source Link <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Activity Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <Card className="w-full max-w-lg bg-[var(--surface)] border-[var(--border)] shadow-2xl">
            <CardHeader className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <CardTitle className="text-base">Log Manual Developer Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowManualModal(false)}>
                ✕
              </Button>
            </CardHeader>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Activity Title *
                </label>
                <Input
                  required
                  placeholder="e.g. Built microservice with Go and Redis"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                    Platform / Origin
                  </label>
                  <select
                    value={manualPlatform}
                    onChange={(e) => setManualPlatform(e.target.value)}
                    className="w-full h-10 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink)] focus:outline-none"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="github">GitHub</option>
                    <option value="leetcode">LeetCode</option>
                    <option value="hackerrank">HackerRank</option>
                    <option value="kaggle">Kaggle</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                    Activity Type
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    className="w-full h-10 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink)] focus:outline-none"
                  >
                    <option value="learning_task">Learning Task</option>
                    <option value="problem_solved">Problem Solved</option>
                    <option value="commit">Project Implementation</option>
                    <option value="certification">Certification</option>
                    <option value="contest">Contest</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Description / Achievements
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="Details of the implementation, architecture, or benchmark..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                    Activity Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                    Duration Minutes (Optional)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="1440"
                    placeholder="e.g. 45"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Source or Verification Link (Optional)
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Skills Practiced (Comma-separated)
                </label>
                <Input
                  placeholder="e.g. Go, Redis, Docker, System Design"
                  value={manualSkills}
                  onChange={(e) => setManualSkills(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createMutation.isPending || !manualTitle.trim()}
                >
                  {createMutation.isPending ? "Logging..." : "Confirm & Log"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

