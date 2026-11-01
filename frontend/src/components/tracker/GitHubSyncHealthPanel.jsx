import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  RefreshCw,
  GitBranch,
  FolderGit2,
  Sparkles,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Activity,
  Layers,
} from "lucide-react";
import { useSyncPlatform, useRateLimit, useSyncLogs } from "@/hooks/useDeveloperTracker";
import { relativeTime } from "@/lib/utils";

export function GitHubSyncHealthPanel({ profile, onOpenConnectModal }) {
  const [showLogs, setShowLogs] = useState(false);
  const syncMutation = useSyncPlatform();
  const { data: rateLimitData } = useRateLimit();
  const { data: logsData } = useSyncLogs("github", 5);

  const ghConn = profile?.platforms?.find((p) => p.platform === "github");
  const isConnected = Boolean(ghConn);
  const isSyncing = syncMutation.isPending || ghConn?.status === "syncing";
  const stats = ghConn?.cachedStats || {};
  const rateLimit = stats?.rateLimit || rateLimitData?.rateLimit;
  const recentLogs = logsData?.logs || [];

  const handleSyncNow = () => {
    syncMutation.mutate("github");
  };

  if (!isConnected) {
    return (
      <Card className="border-[var(--border)] bg-gradient-to-r from-blue-950/20 via-[var(--surface)] to-purple-950/20">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)]">
              <GitBranch size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--ink)]">
                Connect GitHub for Real-Time Repository & Contribution Tracking
              </h4>
              <p className="text-xs text-[var(--ink-muted)]">
                Synchronize all public repositories, direct commits, and 365-day contribution heatmaps.
              </p>
            </div>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={onOpenConnectModal}
            className="text-xs shrink-0 gap-1.5"
          >
            Connect GitHub
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)] overflow-hidden shadow-card">
      <div className="bg-[var(--surface-2)]/70 px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[var(--surface)] flex items-center justify-center">
            <GitBranch size={15} className="text-emerald-400" />
          </div>
          <span className="font-semibold text-[var(--ink)]">
            GitHub Live Synchronization Engine
          </span>
          <Badge tone="success" className="text-[10px] gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected (@{ghConn.handle})
          </Badge>
          {ghConn.profileUrl && (
            <a
              href={ghConn.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 text-[11px]"
            >
              Profile <ExternalLink size={10} />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rateLimit && (
            <span className="text-[11px] text-[var(--ink-muted)] hidden md:inline-flex items-center gap-1 font-mono">
              <Activity size={11} className="text-[var(--accent)]" />
              API: {rateLimit.remaining}/{rateLimit.limit} req/hr
            </span>
          )}
          <Button
            variant="accent"
            size="sm"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="h-7 text-xs gap-1.5"
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : "Sync GitHub Now"}
          </Button>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Sync Summary Banner */}
        {stats.lastSyncSummary && (
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Latest Real-Time Sync Status: </span>
              <span>{stats.lastSyncSummary}</span>
            </div>
            {ghConn.lastSyncAt && (
              <span className="text-[10px] text-emerald-400/80 shrink-0">
                {relativeTime(ghConn.lastSyncAt)}
              </span>
            )}
          </div>
        )}

        {/* Sync Stat Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)]">
            <span className="text-[10px] text-[var(--ink-muted)] block flex items-center gap-1">
              <FolderGit2 size={11} /> Repositories Discovered
            </span>
            <strong className="text-base text-[var(--ink)] block mt-0.5">
              {stats.repositoriesCount || stats.publicRepos || 0}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)]">
            <span className="text-[10px] text-[var(--ink-muted)] block flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" /> New Repos Detected
            </span>
            <strong className="text-base text-[var(--ink)] block mt-0.5">
              {stats.newRepositoriesDetected ?? 0}
              {stats.newRepositoriesDetected > 0 && (
                <span className="text-[10px] ml-1.5 text-emerald-400 font-semibold">New</span>
              )}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)]">
            <span className="text-[10px] text-[var(--ink-muted)] block flex items-center gap-1">
              <Clock size={11} /> Last Synced
            </span>
            <strong className="text-xs text-[var(--ink)] block mt-1 truncate">
              {ghConn.lastSyncAt ? relativeTime(ghConn.lastSyncAt) : "Pending sync"}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)]">
            <span className="text-[10px] text-[var(--ink-muted)] block flex items-center gap-1">
              <Layers size={11} /> Direct Commits Verified
            </span>
            <strong className="text-base text-[var(--ink)] block mt-0.5">
              {stats.directCommitsFound ?? 0}
            </strong>
          </div>
        </div>

        {/* Sync Logs Toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/60 text-xs">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            {showLogs ? "Hide Sync Audit Log" : "View Synchronization Audit Log"} ({recentLogs.length})
          </button>

          <span className="text-[10px] text-[var(--ink-muted)]">
            Deduplicated & Persisted to MongoDB
          </span>
        </div>

        {/* Audit Log Drawer */}
        {showLogs && (
          <div className="space-y-1.5 pt-2 animate-in fade-in-50 text-xs">
            {recentLogs.length === 0 ? (
              <p className="text-[11px] text-[var(--ink-muted)] italic">
                No previous sync logs recorded yet. Click "Sync GitHub Now" to trigger an audit.
              </p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log._id}
                  className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        log.status === "success" ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    <span className="text-[var(--ink)] truncate">{log.summary}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[10px] text-[var(--ink-muted)] font-mono">
                    <span>{log.durationMs}ms</span>
                    <span>{relativeTime(log.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

