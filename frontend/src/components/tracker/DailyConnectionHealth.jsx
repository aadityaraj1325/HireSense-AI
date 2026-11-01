import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Calendar,
  Layers,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useDailyHealth, useSyncPlatform } from "@/hooks/useDeveloperTracker";

export function DailyConnectionHealth({ onOpenConnectModal }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedPlatforms, setExpandedPlatforms] = useState({});
  const { data, isLoading } = useDailyHealth(7);
  const syncMutation = useSyncPlatform();

  const toggleExpand = (platform) => {
    setExpandedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const days = data?.days || [];
  const selectedDay = days[selectedDayIndex] || days[0];

  const handleSync = (platform) => {
    syncMutation.mutate(platform);
  };

  return (
    <Card className="border-[var(--border)] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-[var(--accent)]" size={18} />
            <CardTitle>Daily Connection & Activity Health Tracker</CardTitle>
          </div>
          <CardDescription>
            Audit per-day operational health across all connected accounts. Verifies real work vs active standby days.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={data?.errorCount > 0 ? "warning" : "success"} className="text-xs">
            {data?.healthyCount ?? 0} Connected / {data?.errorCount ?? 0} Issues
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenConnectModal && onOpenConnectModal()}
            className="text-xs"
          >
            Manage Links
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Day Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const hasWork = day.totalActivitiesCount > 0;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-[var(--ink)] text-[var(--bg)] font-semibold shadow-sm"
                    : "bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                <span>{day.label}</span>
                <span className="font-mono text-[10px] opacity-75">({day.date.slice(5)})</span>
                {hasWork && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Status Overview */}
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[var(--ink-muted)]">
            Loading connection health records...
          </div>
        ) : !selectedDay ? (
          <div className="py-8 text-center text-xs text-[var(--ink-muted)]">
            No health records available. Connect your platforms above.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs text-[var(--ink-muted)]">Auditing Date</div>
                <div className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
                  <Calendar size={15} className="text-[var(--accent)]" />
                  {selectedDay.label} ({selectedDay.date})
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-[var(--ink-muted)] block">Activities Verified</span>
                  <strong className="text-emerald-400 text-sm font-semibold">
                    {selectedDay.totalActivitiesCount} work items
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--ink-muted)] block">Deep Work</span>
                  <strong className="text-[var(--ink)] text-sm font-semibold">
                    {selectedDay.focusMinutes} mins
                  </strong>
                </div>
              </div>
            </div>

            {/* Platform Health Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedDay.platforms.map((p) => {
                const isError = p.statusBadge === "error";
                const isWork = p.statusBadge === "work_detected";
                const isStandby = p.statusBadge === "verified_standby";

                return (
                  <div
                    key={p.platform}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isError
                        ? "bg-red-950/20 border-red-500/30"
                        : isWork
                        ? "bg-emerald-950/20 border-emerald-500/40"
                        : "bg-[var(--surface-2)]/50 border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--ink)] capitalize">
                            {p.platform}
                          </span>
                          {p.profileUrl && (
                            <a
                              href={p.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--accent)] hover:underline"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <div className="text-xs font-mono text-[var(--ink-muted)]">
                          @{p.handle}
                        </div>
                      </div>

                      <Badge
                        tone={isWork ? "success" : isError ? "danger" : "neutral"}
                        className="text-[10px]"
                      >
                        {isWork
                          ? "Work Detected"
                          : isError
                          ? "Connection Error"
                          : "Active & Verified (Standby)"}
                      </Badge>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--ink)]">
                      {p.summaryText}
                    </p>

                    {/* Collapsible activities list if work was detected */}
                    {p.activities && p.activities.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(p.platform)}
                          className="text-[11px] font-medium text-[var(--accent)] hover:underline flex items-center gap-1"
                        >
                          {expandedPlatforms[p.platform] ? (
                            <>
                              <ChevronUp size={12} /> Hide {p.activities.length} activity details
                            </>
                          ) : (
                            <>
                              <ChevronDown size={12} /> View {p.activities.length} activity details
                            </>
                          )}
                        </button>

                        {expandedPlatforms[p.platform] && (
                          <div className="space-y-1.5 pt-1.5 max-h-40 overflow-y-auto">
                            {p.activities.map((act) => (
                              <div
                                key={act.id || act.title}
                                className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] flex items-center justify-between gap-2"
                              >
                                <div className="truncate">
                                  <span className="font-medium text-[var(--ink)]">{act.title}</span>
                                  {act.time && (
                                    <span className="text-[10px] text-[var(--ink-muted)] ml-2">
                                      {new Date(act.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  )}
                                </div>
                                {act.sourceUrl && (
                                  <a
                                    href={act.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[var(--accent)] hover:underline shrink-0"
                                  >
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/50 text-xs">
                      <span className="text-[10px] text-[var(--ink-muted)]">
                        {p.workDetected
                          ? `${p.activityCount} recorded actions on this date`
                          : "0 events found on this date (Standby)"}
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(p.platform)}
                        disabled={syncMutation.isPending}
                        className="h-7 text-xs gap-1"
                      >
                        <RefreshCw size={11} className={syncMutation.isPending ? "animate-spin" : ""} />
                        Re-verify & Sync
                      </Button>
                    </div>
                  </div>
                );
              })}

              {selectedDay.platforms.length === 0 && (
                <div className="sm:col-span-2 p-6 rounded-2xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--ink-muted)]">
                  No platforms currently connected. Connect GitHub or LeetCode to track daily activity.
                </div>
              )}
            </div>

            {/* Helper Notice for Profile Links & Emails */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2.5 text-xs text-[var(--ink-muted)]">
              <Info size={15} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--ink)]">Connecting by Profile Link:</strong> You can paste your complete profile URL (e.g. <span className="font-mono text-[var(--accent)]">https://github.com/aadityaraj1325</span> or <span className="font-mono text-[var(--accent)]">https://leetcode.com/u/your_handle</span>). The system automatically validates and tracks your work day-by-day.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

