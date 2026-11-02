import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  FileText,
  History,
  Volume2,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useResumesList } from "@/hooks/useResumes";
import { useInterviews, useInterviewPerformance } from "@/hooks/useInterviews";
import { InterviewSetupWizard } from "@/components/interview/setup/InterviewSetupWizard";

export default function Interview() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("studio"); // "studio" | "history"

  const { data: resumes = [], isLoading: resumesLoading } = useResumesList();
  const { data: sessions = [], isLoading: sessionsLoading } = useInterviews();
  const { data: perfSummary } = useInterviewPerformance();

  if (resumesLoading) {
    return (
      <div className="text-sm text-[var(--ink-muted)] py-12 text-center">
        Loading interview configuration...
      </div>
    );
  }

  if (!resumes.length) {
    return (
      <EmptyState
        icon={FileText}
        title="Upload a resume first"
        description="Your live interview questions and project deep-dives are grounded directly in your resume. Please upload a resume before entering the studio."
        action={
          <Button variant="accent" onClick={() => navigate("/resumes")}>
            Upload Resume
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--accent-strong)] font-semibold mb-2">
            <BrainCircuit size={16} /> HireSense AI • Intelligent Live Interview Protocol (IIP)
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
            Production AI Video & Voice Interviewer
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Experience a realistic technical interview with transparent face presence monitoring, interactive voice recognition, adaptive questioning, and resume-grounded project interrogation.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "studio"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Volume2 size={14} /> Setup Wizard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "history"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <History size={14} /> History ({sessions.length})
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE STUDIO SETUP WIZARD */}
      {activeTab === "studio" && <InterviewSetupWizard resumes={resumes} />}

      {/* TAB 2: INTERVIEW HISTORY & PERFORMANCE */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Performance Overview Banner */}
          {perfSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--ink)]">
                  {perfSummary.sessionsCompleted || 0}
                </div>
                <div className="text-xs text-[var(--ink-muted)] mt-1 font-medium">
                  Completed Sessions
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--accent-strong)]">
                  {perfSummary.averageScore || 0}%
                </div>
                <div className="text-xs text-[var(--ink-muted)] mt-1 font-medium">
                  Average Performance
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--ink)]">
                  {perfSummary.answered || 0}
                </div>
                <div className="text-xs text-[var(--ink-muted)] mt-1 font-medium">
                  Questions Answered
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-amber-500">
                  {perfSummary.weakConcepts?.length || 0}
                </div>
                <div className="text-xs text-[var(--ink-muted)] mt-1 font-medium">
                  Flagged Concepts
                </div>
              </div>
            </div>
          )}

          {/* Past Sessions List */}
          <Card padding="lg" radius="lg">
            <CardHeader>
              <div>
                <CardTitle className="text-base">Previous Interview Sessions</CardTitle>
                <CardDescription>
                  Review questions, evaluations, and revision roadmaps from past sessions.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--ink-muted)]">
                  No interview sessions recorded yet. Complete the setup wizard above to start your
                  first session!
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {sessions.map((s) => (
                    <div
                      key={s._id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[var(--ink)]">{s.targetJob}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--border)] capitalize">
                            {s.mode || "studio"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--ink-muted)]">
                          <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{s.questions?.length || 0} Questions</span>
                          <span>•</span>
                          <span className="capitalize">
                            {s.currentDifficulty || s.requestedDifficulty}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {s.performance?.averageScore != null && (
                          <div className="text-right">
                            <span className="text-lg font-bold font-mono text-[var(--accent-strong)]">
                              {s.performance.averageScore}%
                            </span>
                            <span className="text-[10px] text-[var(--ink-muted)] block">
                              Avg Score
                            </span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/interview/live/${s._id}`)}
                          className="gap-1.5 text-xs"
                        >
                          View Studio / Report <ArrowRight size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
