import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Printer, Download, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { developerTrackerApi } from "@/api/developerTracker";

export function DeveloperReportModal({ onClose }) {
  const [reportType, setReportType] = useState("weekly");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    developerTrackerApi
      .getReport(reportType)
      .then((res) => {
        if (mounted) setReportData(res.report);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50">
      <Card className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden bg-[var(--surface)] border-[var(--border)] shadow-2xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="text-[var(--accent)]" size={20} />
              <CardTitle>Developer Career Performance Report</CardTitle>
            </div>
            <CardDescription>
              Authoritative, verifiable summary of developer progress, coding volume, and skill proof.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer size={14} /> Print / Save PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        {/* Report Type Switcher */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]/50 shrink-0 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "weekly", label: "Weekly Report" },
            { id: "monthly", label: "Monthly Progress" },
            { id: "consistency", label: "Consistency Report" },
            { id: "readiness", label: "Job Readiness Report" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                reportType === tab.id
                  ? "bg-[var(--ink)] text-[var(--bg)] font-semibold shadow-sm"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Printable Report Canvas */}
        <CardContent className="overflow-y-auto p-8 space-y-6 print:p-0 print:space-y-4">
          {loading ? (
            <div className="py-20 text-center text-xs text-[var(--ink-muted)]">
              Generating structured developer report...
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="border-b border-[var(--border)] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent)]">
                    HireSense AI · Developer Intelligence Hub
                  </span>
                  <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight capitalize mt-1">
                    {reportType.replace("_", " ")} Developer Audit
                  </h2>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                    Target Role: <strong className="text-[var(--ink)]">{reportData.userTargetRole}</strong> · Generated:{" "}
                    {new Date(reportData.generatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-right">
                  <div className="text-xs text-[var(--ink-muted)]">Job Readiness</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {reportData.readinessPercentage}%
                  </div>
                </div>
              </div>

              {/* Connected Platforms */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Verified Data Sources
                </h4>
                <div className="grid gap-2 sm:grid-cols-3">
                  {reportData.connectedPlatforms.length > 0 ? (
                    reportData.connectedPlatforms.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
                      >
                        <div className="font-semibold text-[var(--ink)] capitalize">{p.platform}</div>
                        <div className="text-[11px] font-mono text-[var(--ink-muted)]">@{p.handle}</div>
                        <div className="mt-1 text-[10px] text-emerald-400">Status: {p.status}</div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-xs text-[var(--ink-muted)] italic">
                      No external platforms connected. Generated using manual logs and focus sessions.
                    </div>
                  )}
                </div>
              </div>

              {/* Core Metrics Grid */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--ink-muted)]">Total Problems Solved</div>
                  <div className="text-xl font-bold text-[var(--ink)] mt-1">
                    {reportData.overallStats?.totalProblemsSolved || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--ink-muted)]">GitHub Commits</div>
                  <div className="text-xl font-bold text-[var(--ink)] mt-1">
                    {reportData.overallStats?.githubCommits || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--ink-muted)]">Active Coding Days</div>
                  <div className="text-xl font-bold text-[var(--ink)] mt-1">
                    {reportData.overallStats?.activeCodingDays || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--ink-muted)]">Deep Work Hours</div>
                  <div className="text-xl font-bold text-[var(--ink)] mt-1">
                    {Math.round((reportData.totalFocusMinutes || 0) / 60 * 10) / 10}h
                  </div>
                </div>
              </div>

              {/* Proof of Work Skills */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Demonstrated Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {reportData.topSkillsDemonstrated.length > 0 ? (
                    reportData.topSkillsDemonstrated.map((s, idx) => (
                      <Badge key={idx} tone="success" className="px-3 py-1 text-xs">
                        <CheckCircle2 size={12} /> {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--ink-muted)] italic">
                      No skills fully demonstrated yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Priority Gaps & Opportunities */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Identified Gaps for {reportData.userTargetRole}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {reportData.areasForImprovement.map((s, idx) => (
                    <Badge key={idx} tone="warning" className="px-3 py-1 text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recent Verified Activities */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Recent Verified Work ({reportData.recentHighlights.length})
                </h4>
                <div className="space-y-1.5">
                  {reportData.recentHighlights.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[var(--ink)]">
                        [{act.platform}] {act.title}
                      </span>
                      <span className="font-mono text-[var(--ink-muted)]">{act.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification & Authenticity Footer */}
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--ink-muted)] space-y-1">
                <div className="font-semibold text-[var(--ink)]">HireSense AI Verification Guarantee</div>
                <div>
                  This document was automatically compiled from authentic activity streams and synchronized APIs. No statistics were generated or inferred.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-red-400">Failed to render report.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

