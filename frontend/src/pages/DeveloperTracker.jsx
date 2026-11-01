import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Code2,
  RefreshCw,
  Plus,
  FileText,
  Bot,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  GitBranch,
  Calendar,
  Trophy,
  Clock,
  Target,
  ExternalLink,
  AlertTriangle,
  FolderGit2,
} from "lucide-react";
import {
  useDeveloperProfile,
  useDeveloperOverview,
  useDeveloperCalendar,
  useProofOfWork,
  useSkillIntelligence,
  useSyncPlatform,
  useUpdateDeveloperProfile,
} from "@/hooks/useDeveloperTracker";

import { ContributionHeatmap } from "@/components/tracker/ContributionHeatmap";
import { FocusTimer } from "@/components/tracker/FocusTimer";
import { ProofOfWorkGraph } from "@/components/tracker/ProofOfWorkGraph";
import { PlatformConnectionModal } from "@/components/tracker/PlatformConnectionModal";
import { ActivityTimeline } from "@/components/tracker/ActivityTimeline";
import { ResumeBridgeCard } from "@/components/tracker/ResumeBridgeCard";
import { DeveloperCoachChat } from "@/components/tracker/DeveloperCoachChat";
import { DeveloperReportModal } from "@/components/tracker/DeveloperReportModal";
import { DailyConnectionHealth } from "@/components/tracker/DailyConnectionHealth";
import { GitHubSyncHealthPanel } from "@/components/tracker/GitHubSyncHealthPanel";
import { RepositoriesList } from "@/components/tracker/RepositoriesList";

export default function DeveloperTracker() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Queries
  const { data: profileData, isLoading: profileLoading } = useDeveloperProfile();
  const { data: overviewData, isLoading: overviewLoading } = useDeveloperOverview(dateRange, platformFilter);
  const { data: calendarData, isLoading: calendarLoading } = useDeveloperCalendar(platformFilter);
  const { data: skillIntelData } = useSkillIntelligence();

  const profile = profileData?.profile;
  const targetRole = profile?.targetRole || "Full Stack Engineer";
  const { data: powData, isLoading: powLoading } = useProofOfWork(targetRole);

  const syncMutation = useSyncPlatform();
  const updateProfileMutation = useUpdateDeveloperProfile();

  const handleSyncAll = () => {
    syncMutation.mutate("all");
  };

  const handleRoleChange = (newRole) => {
    updateProfileMutation.mutate({ targetRole: newRole });
  };

  if (profileLoading && !profile) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-16 w-1/3 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const totals = overviewData?.totals || {};
  const connectedPlatforms = profile?.platforms || [];

  const getPlatformStatusBadge = (platformName) => {
    const conn = profile?.platforms?.find((p) => p.platform === platformName);
    if (!conn) return <Badge tone="neutral">Unlinked</Badge>;
    if (conn.status === "connected") return <Badge tone="success">Connected</Badge>;
    if (conn.status === "syncing") return <Badge tone="accent">Syncing...</Badge>;
    return (
      <Badge
        tone="warning"
        className="cursor-pointer hover:opacity-80 gap-1"
        onClick={() => setShowConnectModal(true)}
      >
        <AlertTriangle size={10} /> Re-verify Link
      </Badge>
    );
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <PageHeader
        title="Developer Intelligence Hub"
        description="Multi-platform coding tracker, daily activity analytics, and verifiable proof-of-work career intelligence."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportModal(true)}
              className="gap-1.5"
            >
              <FileText size={14} /> Career Reports
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAll}
              disabled={syncMutation.isPending}
              className="gap-1.5"
            >
              <RefreshCw size={13} className={syncMutation.isPending ? "animate-spin" : ""} />
              {syncMutation.isPending ? "Syncing..." : "Sync All"}
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setShowConnectModal(true)}
              className="gap-1.5"
            >
              <Plus size={14} /> Connect Platform
            </Button>
          </div>
        }
      />

      {/* Target Role & Connected Platform Bar */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="accent" className="px-3 py-1 text-xs gap-1">
            <Target size={12} /> Target: {targetRole}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
            <span>Connected:</span>
            {connectedPlatforms.length > 0 ? (
              connectedPlatforms.map((p) => (
                <span
                  key={p.platform}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                    p.status === "connected"
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : p.status === "error"
                      ? "bg-red-950/40 border-red-500/40 text-red-300"
                      : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink)]"
                  }`}
                >
                  {p.platform}
                  {p.status === "error" && " (!)"}
                </span>
              ))
            ) : (
              <span className="text-amber-400">None yet (Using manual tracking)</span>
            )}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: "7d", label: "7D" },
            { id: "30d", label: "30D" },
            { id: "90d", label: "90D" },
            { id: "6m", label: "6M" },
            { id: "1y", label: "1Y" },
            { id: "all", label: "All Time" },
          ].map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setDateRange(range.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                dateRange === range.id
                  ? "bg-[var(--ink)] text-[var(--bg)] font-semibold"
                  : "bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metric StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Coding Problems Solved"
          value={totals.problemsSolved ?? 0}
          suffix={`(${totals.easySolved ?? 0}E / ${totals.mediumSolved ?? 0}M / ${totals.hardSolved ?? 0}H)`}
          icon={Code2}
          accent
        />
        <StatCard
          label="GitHub Contributions"
          value={totals.githubContributions ?? 0}
          suffix={`${totals.githubCommits ?? 0} commits`}
          icon={GitBranch}
        />
        <StatCard
          label="Active Coding Days"
          value={totals.activeDays ?? 0}
          suffix="days logged"
          icon={Calendar}
        />
        <StatCard
          label="Focused Deep Work"
          value={totals.focusHours ?? 0}
          suffix="hours completed"
          icon={Clock}
        />
      </div>

      {/* Primary Feature Tabs */}
      <div className="border-b border-[var(--border)] flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview & Heatmap", icon: Activity },
          {
            id: "repositories",
            label: `Repositories (${totals.githubPublicRepos || profile?.statsSummary?.githubPublicRepos || 0})`,
            icon: FolderGit2,
          },
          { id: "activity", label: "Daily Activity & Focus", icon: Clock },
          { id: "proof-of-work", label: "Proof-of-Work Career Graph", icon: ShieldCheck },
          { id: "intelligence", label: "Skill Intelligence & Resume Bridge", icon: Sparkles },
          { id: "coach", label: "Developer Coach AI", icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? "bg-[var(--ink)] text-[var(--bg)] shadow-card"
                  : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW & HEATMAP */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* GitHub Real-Time Sync & Health Panel */}
          <GitHubSyncHealthPanel
            profile={profile}
            onOpenConnectModal={() => setShowConnectModal(true)}
          />

          <ContributionHeatmap
            calendarData={calendarData}
            onSelectDate={(d) => {
              setSelectedDate(d);
              if (d) setActiveTab("activity");
            }}
            selectedDate={selectedDate}
          />

          {/* Daily Operational Health Tracker */}
          <DailyConnectionHealth onOpenConnectModal={() => setShowConnectModal(true)} />

          {/* Connected Platform Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--ink)]">
                Platform Breakdown & Verified Metrics
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectModal(true)}
                className="text-xs text-[var(--accent)]"
              >
                Manage Connections & Links →
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* GitHub Card */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
                      <GitBranch size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--ink)]">GitHub</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">
                        {profile?.platforms?.find((p) => p.platform === "github")?.handle
                          ? `@${profile.platforms.find((p) => p.platform === "github").handle}`
                          : "Not connected"}
                      </div>
                    </div>
                  </div>
                  {getPlatformStatusBadge("github")}
                </div>

                {profile?.platforms?.find((p) => p.platform === "github")?.lastError && (
                  <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-tight">
                    {profile.platforms.find((p) => p.platform === "github").lastError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-[var(--ink-muted)] block">Public Repos</span>
                      <strong className="text-[var(--ink)]">{totals.githubPublicRepos ?? 0}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--ink-muted)] block">Total Stars</span>
                      <strong className="text-[var(--ink)]">{totals.githubStars ?? 0}</strong>
                    </div>
                  </div>
                  {profile?.platforms?.some((p) => p.platform === "github") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncMutation.mutate("github")}
                      disabled={syncMutation.isPending}
                      className="h-6 px-2 text-[10px] gap-1 shrink-0"
                    >
                      <RefreshCw size={10} className={syncMutation.isPending ? "animate-spin" : ""} /> Sync
                    </Button>
                  )}
                </div>
              </Card>

              {/* LeetCode Card */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-amber-400">
                      <Code2 size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--ink)]">LeetCode</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">
                        {profile?.platforms?.find((p) => p.platform === "leetcode")?.handle
                          ? `@${profile.platforms.find((p) => p.platform === "leetcode").handle}`
                          : "Not connected"}
                      </div>
                    </div>
                  </div>
                  {getPlatformStatusBadge("leetcode")}
                </div>

                {profile?.platforms?.find((p) => p.platform === "leetcode")?.lastError && (
                  <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-tight">
                    {profile.platforms.find((p) => p.platform === "leetcode").lastError}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 block">Easy</span>
                    <strong className="text-[var(--ink)]">{totals.easySolved ?? 0}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 block">Medium</span>
                    <strong className="text-[var(--ink)]">{totals.mediumSolved ?? 0}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-red-400 block">Hard</span>
                      <strong className="text-[var(--ink)]">{totals.hardSolved ?? 0}</strong>
                    </div>
                    {profile?.platforms?.some((p) => p.platform === "leetcode") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => syncMutation.mutate("leetcode")}
                        disabled={syncMutation.isPending}
                        className="h-6 px-1.5 text-[10px] gap-1 shrink-0 self-end"
                      >
                        <RefreshCw size={9} className={syncMutation.isPending ? "animate-spin" : ""} /> Sync
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Codeforces Card */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-blue-400">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--ink)]">Codeforces</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">
                        {profile?.platforms?.find((p) => p.platform === "codeforces")?.handle
                          ? `@${profile.platforms.find((p) => p.platform === "codeforces").handle}`
                          : "Not connected"}
                      </div>
                    </div>
                  </div>
                  {getPlatformStatusBadge("codeforces")}
                </div>

                {profile?.platforms?.find((p) => p.platform === "codeforces")?.lastError && (
                  <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-tight">
                    {profile.platforms.find((p) => p.platform === "codeforces").lastError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-[var(--ink-muted)] block">Current Rating</span>
                      <strong className="text-[var(--ink)]">
                        {totals.currentRating ? totals.currentRating : "Unranked"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--ink-muted)] block">Contests</span>
                      <strong className="text-[var(--ink)]">{totals.contestsAttended ?? 0}</strong>
                    </div>
                  </div>
                  {profile?.platforms?.some((p) => p.platform === "codeforces") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncMutation.mutate("codeforces")}
                      disabled={syncMutation.isPending}
                      className="h-6 px-2 text-[10px] gap-1 shrink-0"
                    >
                      <RefreshCw size={10} className={syncMutation.isPending ? "animate-spin" : ""} /> Sync
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REPOSITORIES */}
      {activeTab === "repositories" && (
        <div className="space-y-6">
          <GitHubSyncHealthPanel
            profile={profile}
            onOpenConnectModal={() => setShowConnectModal(true)}
          />
          <RepositoriesList />
        </div>
      )}

      {/* TAB CONTENT: 2. DAILY ACTIVITY & FOCUS */}
      {activeTab === "activity" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <ActivityTimeline
              selectedDate={selectedDate}
              onClearDateFilter={() => setSelectedDate(null)}
            />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <FocusTimer />
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. PROOF-OF-WORK CAREER GRAPH */}
      {activeTab === "proof-of-work" && (
        <ProofOfWorkGraph
          proofOfWorkData={powData}
          activeRole={targetRole}
          onRoleChange={handleRoleChange}
        />
      )}

      {/* TAB CONTENT: 4. SKILL INTELLIGENCE & RESUME BRIDGE */}
      {activeTab === "intelligence" && (
        <div className="space-y-6">
          {/* Skill Growth Recommendations */}
          <Card className="border-[var(--border)]">
            <CardHeader className="border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[var(--accent)]" size={18} />
                <CardTitle>Developer Skill Intelligence & Weakness Detector</CardTitle>
              </div>
              <CardDescription>
                Data-driven feedback comparing your algorithmic volume, repository completeness, and target role needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {(skillIntelData?.recommendations || []).map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--ink)]">
                        {rec.title}
                      </span>
                      <Badge
                        tone={
                          rec.priority === "high"
                            ? "warning"
                            : rec.priority === "medium"
                            ? "neutral"
                            : "success"
                        }
                        className="text-[10px]"
                      >
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                      {rec.description}
                    </p>
                    <div className="p-2.5 rounded-xl bg-[var(--surface)] text-xs text-emerald-400 font-medium">
                      → Action: {rec.suggestedAction}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity-to-Resume Bridge */}
          <ResumeBridgeCard />
        </div>
      )}

      {/* TAB CONTENT: 5. DEVELOPER COACH AI */}
      {activeTab === "coach" && <DeveloperCoachChat />}

      {/* Modals */}
      {showConnectModal && (
        <PlatformConnectionModal
          profile={profile}
          onClose={() => setShowConnectModal(false)}
        />
      )}

      {showReportModal && (
        <DeveloperReportModal onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}
