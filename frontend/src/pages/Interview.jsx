import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  Sparkles,
  FileText,
  Upload,
  Briefcase,
  Layers,
  Award,
  Clock,
  History,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sliders,
  ChevronRight,
  Volume2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useResumesList } from "@/hooks/useResumes";
import {
  useInterviews,
  useInitStudio,
  useAnalyzeJd,
  useInterviewPerformance,
} from "@/hooks/useInterviews";

const INTERVIEW_TYPES = [
  { id: "technical", label: "Technical Deep-Dive", desc: "Core algorithms, architectures & code trade-offs" },
  { id: "project", label: "Project Defense & STAR", desc: "In-depth interrogation of your specific built projects" },
  { id: "system_design", label: "System Design & Scaling", desc: "Distributed architectures, queues & bottlenecks" },
  { id: "behavioral", label: "Behavioral & Leadership", desc: "Collaboration, conflict resolution & teamwork" },
  { id: "mixed", label: "Comprehensive Mixed Round", desc: "Balanced technical, architectural & behavioral" },
];

const PERSONALITIES = [
  { id: "professional", label: "Professional", desc: "Objective, balanced, structured tech lead" },
  { id: "friendly", label: "Warm & Encouraging", desc: "Supportive mentor, prompts when stuck" },
  { id: "strict", label: "Strict & Rigorous", desc: "Digs into edge cases, requires exact reasoning" },
  { id: "challenging", label: "FAANG Staff Level", desc: "Complex stress-testing and architectural depth" },
];

export default function Interview() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("studio"); // "studio" | "history"

  const { data: resumes = [], isLoading: resumesLoading } = useResumesList();
  const { data: sessions = [], isLoading: sessionsLoading } = useInterviews();
  const { data: perfSummary } = useInterviewPerformance();

  const initStudio = useInitStudio();
  const analyzeJd = useAnalyzeJd();

  // Setup form states
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("Full Stack Engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [jobAnalysis, setJobAnalysis] = useState(null);
  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("adaptive");
  const [duration, setDuration] = useState(30);
  const [personality, setPersonality] = useState("professional");
  const [interviewStyle, setInterviewStyle] = useState("conversational");

  // Default resume selection
  const activeResume = useMemo(() => {
    if (!resumes.length) return null;
    return resumes.find((r) => r._id === selectedResumeId) || resumes[0];
  }, [resumes, selectedResumeId]);

  // Handle JD auto-analysis
  const handleAnalyzeJD = () => {
    if (!jobDescription.trim()) return;
    analyzeJd.mutate(
      { jobDescription, targetRole },
      {
        onSuccess: (data) => {
          setJobAnalysis(data.jobAnalysis);
          if (data.jobAnalysis?.targetRole) {
            setTargetRole(data.jobAnalysis.targetRole);
          }
        },
      }
    );
  };

  // Launch live interview
  const handleStartLiveStudio = () => {
    if (!activeResume) return;

    const payload = {
      resumeId: activeResume._id,
      targetJob: (targetRole || activeResume.targetRole || "Software Engineer").trim(),
      jobDescription: (jobDescription || "").trim(),
      jobAnalysis: jobAnalysis || undefined,
      interviewType,
      difficulty,
      duration: Number(duration) || 30,
      interviewerPersonality: personality,
      interviewStyle,
      technicalSkills: (activeResume.parsedData?.skills || [])
        .filter((s) => typeof s === "string" && s.trim().length > 0)
        .slice(0, 30),
    };

    initStudio.mutate(payload, {
      onSuccess: (data) => {
        navigate(`/interview/live/${data.session._id}`);
      },
    });
  };

  if (resumesLoading) {
    return <div className="text-sm text-[var(--ink-muted)] py-12 text-center">Loading interview configuration...</div>;
  }

  if (!resumes.length) {
    return (
      <EmptyState
        icon={FileText}
        title="Upload a resume first"
        description="Your live interview questions and project deep-dives are grounded directly in your resume. Please upload a resume before entering the studio."
        action={<Button variant="accent" onClick={() => navigate("/resumes")}>Upload Resume</Button>}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--accent-strong)] font-semibold mb-2">
            <BrainCircuit size={16} /> HireSense AI • Live Interview Studio
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
            Real-Time AI Voice Interviewer
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-1.5 max-w-2xl leading-relaxed">
            Speak naturally through your microphone with an adaptive AI interviewer. Questions are grounded in your actual resume projects and target job specifications.
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
            <Volume2 size={14} /> Live Studio Setup
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

      {/* TAB 1: LIVE STUDIO SETUP */}
      {activeTab === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Configuration Steps (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: RESUME SELECTION */}
            <Card padding="lg" radius="lg">
              <CardHeader>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] font-mono">
                    Step 1 of 3
                  </div>
                  <CardTitle className="text-lg mt-0.5">Select Grounding Resume</CardTitle>
                  <CardDescription>The AI will read your projects and skills to test your real-world experience.</CardDescription>
                </div>
                <FileText size={20} className="text-[var(--accent)]" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {resumes.map((r) => {
                    const isSelected = (selectedResumeId || resumes[0]?._id) === r._id;
                    return (
                      <div
                        key={r._id}
                        onClick={() => setSelectedResumeId(r._id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[var(--accent-soft)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                            : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[var(--ink)] truncate max-w-[200px]">{r.title || "Untitled Resume"}</h4>
                          {isSelected && <CheckCircle2 size={16} className="text-[var(--accent-strong)] shrink-0" />}
                        </div>
                        <div className="text-xs text-[var(--ink-muted)] mt-1">
                          Role: <span className="text-[var(--ink)] font-medium">{r.targetRole || "Software Engineer"}</span>
                        </div>
                        <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                          Updated {new Date(r.updatedAt || r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Parsed Preview Pills */}
                {activeResume?.parsedData?.skills?.length ? (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <span className="text-xs font-semibold text-[var(--ink-muted)] block mb-1.5">
                      Detected Skills Grounded:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeResume.parsedData.skills.slice(0, 10).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)]">
                          {skill}
                        </span>
                      ))}
                      {activeResume.parsedData.skills.length > 10 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-[var(--ink-muted)]">
                          +{activeResume.parsedData.skills.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* STEP 2: TARGET JOB DESCRIPTION */}
            <Card padding="lg" radius="lg">
              <CardHeader>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] font-mono">
                    Step 2 of 3
                  </div>
                  <CardTitle className="text-lg mt-0.5">Job Description &amp; Company Context</CardTitle>
                  <CardDescription>Paste the complete job description. Gemini will extract requirements to tailor the interview.</CardDescription>
                </div>
                <Briefcase size={20} className="text-[var(--accent)]" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Target Role Title</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer, AI Engineer, Staff Backend Developer"
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[var(--ink)]">Paste Job Description</label>
                    <button
                      type="button"
                      onClick={() =>
                        setJobDescription(
                          "We are seeking a Senior Full Stack Engineer with strong experience in Node.js, React, distributed microservices, Redis caching, and real-time streaming architectures. Responsibilities include system architecture, API performance tuning, and mentoring junior engineers."
                        )
                      }
                      className="text-[11px] text-[var(--accent-strong)] hover:underline"
                    >
                      Fill sample Tech Lead JD
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job posting text here (responsibilities, requirements, tech stack)..."
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] resize-y"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!jobDescription.trim() || analyzeJd.isPending}
                    onClick={handleAnalyzeJD}
                    className="text-xs gap-1.5"
                  >
                    <Sparkles size={14} className="text-[var(--accent)]" />
                    <span>{analyzeJd.isPending ? "Analyzing with Gemini..." : "Extract Requirements with AI"}</span>
                  </Button>

                  {jobAnalysis && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Company: {jobAnalysis.companyName || "Extracted"}
                    </span>
                  )}
                </div>

                {/* Extracted JD Summary Badge View */}
                {jobAnalysis && (
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-2 text-xs">
                    <div className="font-semibold text-[var(--ink)]">Extracted Target Requirements:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {jobAnalysis.requiredSkills?.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* STEP 3: INTERVIEW STUDIO CONFIGURATION */}
            <Card padding="lg" radius="lg">
              <CardHeader>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)] font-mono">
                    Step 3 of 3
                  </div>
                  <CardTitle className="text-lg mt-0.5">Interview Parameters &amp; Persona</CardTitle>
                  <CardDescription>Configure interview round type, interviewer persona, and duration.</CardDescription>
                </div>
                <Sliders size={20} className="text-[var(--accent)]" />
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Round Type */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-2">Round Type</label>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {INTERVIEW_TYPES.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setInterviewType(type.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          interviewType === type.id
                            ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--ink)]"
                            : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--accent)]/40"
                        }`}
                      >
                        <div className="text-xs font-bold text-[var(--ink)]">{type.label}</div>
                        <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{type.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty & Duration */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Difficulty Mode</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="adaptive">Adaptive (Recommended - Shifts based on answers)</option>
                      <option value="beginner">Beginner (Foundations &amp; Syntax)</option>
                      <option value="intermediate">Intermediate (Core Architecture)</option>
                      <option value="advanced">Advanced (High-scale &amp; Systems)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Interview Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value={15}>15 Minutes (Rapid Screening)</option>
                      <option value={30}>30 Minutes (Standard Technical Round)</option>
                      <option value={45}>45 Minutes (Full Deep-Dive)</option>
                      <option value={60}>60 Minutes (Onsite Simulation)</option>
                    </select>
                  </div>
                </div>

                {/* Personality */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-2">Interviewer Personality</label>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {PERSONALITIES.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setPersonality(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          personality === p.id
                            ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--ink)]"
                            : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--accent)]/40"
                        }`}
                      >
                        <div className="text-xs font-bold text-[var(--ink)]">{p.label}</div>
                        <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Pre-Interview Intelligence & Launch Action (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Card padding="lg" radius="lg" className="sticky top-24 border-[var(--accent)]/40 shadow-xl">
              <CardHeader>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles size={16} className="text-[var(--accent-strong)]" /> Pre-Interview Intelligence
                  </CardTitle>
                  <CardDescription className="text-xs">Summary of your live conversational session.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-muted)]">Target Role:</span>
                    <span className="font-semibold text-[var(--ink)] text-right truncate max-w-[150px]">{targetRole}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-muted)]">Selected Resume:</span>
                    <span className="font-semibold text-[var(--ink)] text-right truncate max-w-[150px]">{activeResume?.title || "Active"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-muted)]">Round Type:</span>
                    <span className="font-semibold text-[var(--ink)] capitalize">{interviewType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-muted)]">Difficulty:</span>
                    <span className="font-semibold text-[var(--accent-strong)] capitalize">{difficulty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-muted)]">Target Time:</span>
                    <span className="font-semibold text-[var(--ink)]">{duration} Minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-muted)]">Interviewer:</span>
                    <span className="font-semibold text-[var(--ink)] capitalize">{personality}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] leading-relaxed">
                  Your interview will be generated using your selected resume and target job description. The AI will speak aloud, listen via your mic, and adapt in real time.
                </div>

                {/* Prominent Launch Button */}
                <Button
                  variant="accent"
                  size="lg"
                  disabled={initStudio.isPending}
                  onClick={handleStartLiveStudio}
                  className="w-full gap-2 font-bold text-sm shadow-xl"
                >
                  <BrainCircuit size={18} />
                  <span>{initStudio.isPending ? "Generating Studio..." : "Start Live Voice Interview"}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
                <div className="text-xs text-[var(--ink-muted)] mt-1 font-medium">Completed Sessions</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--accent-strong)]">
                  {perfSummary.averageScore || 0}%
                </div>
                <div className="text-xs text-[var(--ink-muted)] mt-1 font-medium">Average Performance</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--ink)]">
                  {perfSummary.answered || 0}
                </div>
                <div className="text-xs text-[var(--ink-muted)] mt-1 font-medium">Questions Answered</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-amber-500">
                  {perfSummary.weakConcepts?.length || 0}
                </div>
                <div className="text-xs text-[var(--ink-muted)] mt-1 font-medium">Flagged Concepts</div>
              </div>
            </div>
          )}

          {/* Past Sessions List */}
          <Card padding="lg" radius="lg">
            <CardHeader>
              <div>
                <CardTitle className="text-base">Previous Interview Sessions</CardTitle>
                <CardDescription>Review questions, evaluations, and revision roadmaps from past sessions.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--ink-muted)]">
                  No interview sessions recorded yet. Start your first session above!
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {sessions.map((s) => (
                    <div key={s._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                          <span className="capitalize">{s.currentDifficulty || s.requestedDifficulty}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {s.performance?.averageScore != null && (
                          <div className="text-right">
                            <span className="text-lg font-bold font-mono text-[var(--accent-strong)]">
                              {s.performance.averageScore}%
                            </span>
                            <span className="text-[10px] text-[var(--ink-muted)] block">Avg Score</span>
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
