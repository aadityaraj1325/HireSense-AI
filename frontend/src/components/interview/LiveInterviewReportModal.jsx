import { useState } from "react";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  BookOpen,
  Code2,
  ChevronDown,
  ChevronUp,
  Download,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function LiveInterviewReportModal({ report, session, onClose, onGoDashboard }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "plan" | "projects" | "questions"
  const [expandedQuestion, setExpandedQuestion] = useState(0);

  if (!report) return null;

  const {
    overallScore = 75,
    technicalScore = 78,
    communicationScore = 80,
    problemSolvingScore = 74,
    projectExplanationScore = 76,
    jobRelevanceScore = 82,
    summary = "Solid technical performance with clear domain strengths.",
    strongConcepts = [],
    weakConcepts = [],
    skillGapAnalysis = [],
    revisionPlan7Days = [],
    learningPlan30Days = [],
    recommendedProjects = [],
    questionBreakdown = [],
  } = report;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 border-b border-[var(--border)] bg-[var(--surface-2)]/60">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent-strong)] mb-1">
              <Sparkles size={14} /> HireSense AI • Post-Interview Intelligence Report
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--ink)]">
              {session?.targetJob || "Target Role"} Interview Evaluation
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)]">
              Grounded in your resume projects &amp; target job requirements
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Overall Score Dial */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-display font-black text-[var(--accent-strong)]">
                  {overallScore}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Overall Score
                </div>
              </div>
            </div>

            <Button variant="accent" size="sm" onClick={onGoDashboard} className="gap-1.5 text-xs">
              Dashboard <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 overflow-x-auto">
          {[
            { id: "overview", label: "Executive Overview", icon: Award },
            { id: "plan", label: "7-Day & 30-Day Plan", icon: Calendar },
            { id: "projects", label: "Recommended Projects", icon: Code2 },
            { id: "questions", label: "Question Breakdown", icon: BookOpen },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === id
                  ? "border-[var(--accent)] text-[var(--accent-strong)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Category Performance Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Technical Depth", score: technicalScore },
                  { label: "Communication", score: communicationScore },
                  { label: "Problem Solving", score: problemSolvingScore },
                  { label: "Project Articulation", score: projectExplanationScore },
                  { label: "Job Relevance", score: jobRelevanceScore },
                ].map(({ label, score }) => (
                  <div key={label} className="p-3.5 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] text-center">
                    <div className="text-xl font-bold font-mono text-[var(--ink)]">{score}%</div>
                    <div className="text-[11px] text-[var(--ink-muted)] font-medium mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Summary Description */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                  Executive Assessment
                </h4>
                <p className="text-sm text-[var(--ink)] leading-relaxed">{summary}</p>
              </div>

              {/* Strong vs Weak Concepts */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5">
                    <CheckCircle2 size={15} /> Demonstrated Strengths
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {strongConcepts.map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2.5">
                    <AlertCircle size={15} /> Areas for Targeted Revision
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {weakConcepts.map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skill Gap Analysis Table */}
              {skillGapAnalysis.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[var(--ink)]">Skill Gap Remediation Matrix</h4>
                  <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)] uppercase tracking-wider font-semibold border-b border-[var(--border)]">
                        <tr>
                          <th className="p-3">Skill / Competency</th>
                          <th className="p-3">Evaluated Status</th>
                          <th className="p-3">Remediation Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {skillGapAnalysis.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                            <td className="p-3 font-semibold text-[var(--ink)]">{row.skill}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[var(--surface-2)] text-[var(--accent-strong)] border border-[var(--border)]">
                                {row.status}
                              </span>
                            </td>
                            <td className="p-3 text-[var(--ink-muted)]">{row.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REVISION & LEARNING PLAN */}
          {activeTab === "plan" && (
            <div className="space-y-6">
              {/* 7-Day Day-by-Day Sprint */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                  <Calendar size={16} className="text-[var(--accent)]" /> 7-Day Quick Revision Sprint
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {revisionPlan7Days.map((day) => (
                    <div key={day.day} className="p-3.5 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--accent-strong)] font-mono">Day {day.day}</span>
                        <span className="text-[11px] text-[var(--ink-muted)] font-medium truncate max-w-[150px]">{day.focus}</span>
                      </div>
                      <ul className="space-y-1 text-xs text-[var(--ink)]">
                        {day.tasks.map((task, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-1.5">
                            <span className="text-[var(--accent)] shrink-0">•</span>
                            <span className="leading-snug">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-Day Mastery Roadmap */}
              <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                  <TrendingUp size={16} className="text-[var(--accent)]" /> 30-Day Mastery Roadmap
                </h4>
                <div className="space-y-3">
                  {learningPlan30Days.map((week) => (
                    <div key={week.week} className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono font-bold text-[var(--accent-strong)]">Week {week.week} Focus</div>
                        <div className="text-sm font-semibold text-[var(--ink)] mt-0.5">{week.focus}</div>
                        <div className="text-xs text-[var(--ink-muted)] mt-1">
                          Projects: <span className="text-[var(--ink)]">{week.projects?.join(", ")}</span>
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block">Deliverable</span>
                        <span className="text-xs font-semibold text-[var(--ink)]">{week.deliverables}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECOMMENDED PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--ink-muted)]">
                Completing these proof-of-work projects bridges your specific interview gaps and gives you compelling STAR stories for upcoming hiring rounds.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {recommendedProjects.map((proj, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-[var(--ink)]">{proj.title}</h4>
                      <p className="text-xs text-[var(--ink-muted)] mt-1.5 leading-relaxed">{proj.description}</p>
                      <div className="mt-3 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs">
                        <span className="font-semibold text-[var(--ink)]">Problem Solved: </span>
                        <span className="text-[var(--ink-muted)]">{proj.problemSolved}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--border)]">
                      {proj.techStack?.map((tech, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: QUESTION BREAKDOWN */}
          {activeTab === "questions" && (
            <div className="space-y-3">
              {questionBreakdown.map((q, idx) => {
                const isExpanded = expandedQuestion === idx;
                return (
                  <div key={idx} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <div className="flex items-center gap-3 pr-2">
                        <span className="h-7 w-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          Q{q.questionNumber || idx + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-[var(--ink)]">{q.prompt}</div>
                          <div className="text-xs text-[var(--ink-muted)] mt-0.5">Score: {q.overallScore}%</div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-2 border-t border-[var(--border)] bg-[var(--surface)] space-y-3 text-xs">
                        <div>
                          <span className="font-semibold text-[var(--ink-muted)] uppercase text-[10px] tracking-wider">
                            Your Spoken Answer Transcript:
                          </span>
                          <p className="mt-1 p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--ink)] italic leading-relaxed">
                            &ldquo;{q.transcript}&rdquo;
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                              Model Answer
                            </span>
                            <p className="text-[var(--ink-muted)] leading-relaxed">{q.modelAnswer}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                            <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">
                              How to Improve in Live Rounds
                            </span>
                            <p className="text-[var(--ink-muted)] leading-relaxed">{q.improvedAnswer}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-[var(--border)] bg-[var(--surface-2)]/40 shrink-0">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
            <Download size={14} /> Print / Save PDF
          </Button>
          <Button variant="accent" size="sm" onClick={onGoDashboard} className="gap-1.5 text-xs">
            Finish and Return to Workspace
          </Button>
        </div>
      </div>
    </div>
  );
}

