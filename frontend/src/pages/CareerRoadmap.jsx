import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Layers3, Loader2,
  MessageCircle, Sparkles, Target, Trophy, WandSparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useResume } from "@/hooks/useResumes";
import { LearningCalendar } from "@/components/roadmap/LearningCalendar";
import { DailyJournal } from "@/components/roadmap/DailyJournal";
import { useCareerRoadmap, useCareerRoadmapByResume, useGenerateCareerRoadmap, useUpdateRoadmapProgress, useRoadmapMentor, useSubmitRoadmapAssessment } from "@/hooks/useCareerRoadmaps";

const setupDefaults = { targetRole: "", jobDescription: "", experienceLevel: "career_switcher", studyMinutesPerDay: 60, durationDays: 90, learningLanguage: "English", learningStyle: "project_based", specialization: "" };

export default function CareerRoadmap() {
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const { id, roadmapId } = useParams();
  const navigate = useNavigate();
  const roadmapQuery = useCareerRoadmap(roadmapId);
  const resumeQuery = useCareerRoadmapByResume(roadmapId ? null : id);
  const query = roadmapId ? roadmapQuery : resumeQuery;
  const resumeQueryData = useResume(id);
  const generate = useGenerateCareerRoadmap();
  const [setup, setSetup] = useState(setupDefaults);
  const [selected, setSelected] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [taskNotes, setTaskNotes] = useState({});
  const [assessmentAnswer, setAssessmentAnswer] = useState("");
  const resumeSkills = resumeQueryData.data?.versions?.find((version) => version._id === resumeQueryData.data?.resume?.currentVersionId)?.parsedSections?.skills || [];
  const roadmap = query.data?.roadmap || query.data;
  const activeRoadmapId = roadmap?._id || roadmapId;
  const progress = useUpdateRoadmapProgress(activeRoadmapId);
  const mentor = useRoadmapMentor(activeRoadmapId);
  const assessment = useSubmitRoadmapAssessment(activeRoadmapId);
  const milestones = roadmap?.milestones || roadmap?.weeks || [];
  const targetJob = typeof roadmap?.targetJob === "object" ? roadmap.targetJob.title : (roadmap?.targetRole || roadmap?.targetJob);
  const active = milestones[selected];
  const completedTasks = roadmap?.progress?.completedTasks ?? roadmap?.completedTasks ?? 0;
  const totalTasks = roadmap?.progress?.totalTasks ?? milestones.reduce((total, item) => total + (item.tasks || item.dailyTasks || []).length, 0);

  const isNotFound = query.error?.status === 404;
  const isSetup = !query.isLoading && (!roadmap || isNotFound);
  const progressPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const tasks = useMemo(
    () => (roadmap?.dailyTasks || []).filter((task) => task.week === active?.week),
    [roadmap?.dailyTasks, active?.week],
  );

  function updateSetup(key, value) {
    setSetup((current) => ({ ...current, [key]: value }));
  }

  async function createRoadmap(event) {
    event.preventDefault();
    if (!setup.targetRole.trim()) return;
    const result = await generate.mutateAsync({
      resumeId: id,
      targetJob: {
        title: setup.targetRole.trim(),
        description: setup.jobDescription.trim() || undefined,
        timeframeWeeks: Math.max(1, Math.ceil(setup.durationDays / 7)),
        experienceLevel: setup.experienceLevel,
        studyMinutesPerDay: setup.studyMinutesPerDay,
        learningLanguage: setup.learningLanguage,
        learningStyle: setup.learningStyle,
        specialization: setup.specialization.trim() || undefined,
      },
    });
    const persistedId = result?.roadmap?._id;
    if (persistedId) {
      navigate(`/resumes/${id}/roadmap/${persistedId}`, { replace: true });
    }
  }

  async function toggleTask(task, taskIndex) {
    await progress.mutateAsync({
      taskId: task._id || task.id || `${selected}-${taskIndex}`,
      status: task.status === "completed" ? "pending" : "completed",
    });
  }

  async function saveTaskNotes(task) {
    const notes = taskNotes[task._id];
    if (notes === undefined) return;
    await progress.mutateAsync({ taskId: task._id, status: task.status, notes });
  }

  async function submitAssessment(event) {
    event.preventDefault();
    if (!assessmentAnswer.trim()) return;
    await assessment.mutateAsync({ week: active?.week, answers: { reflection: assessmentAnswer.trim() } });
    setAssessmentAnswer("");
  }

  async function askMentor(event) {
    event.preventDefault();
    if (!question.trim() || mentor.isPending) return;
    if (activeRoadmapId) {
      navigate(`/resumes/${id}/roadmap/${activeRoadmapId}/mentor?topic=${encodeURIComponent(question.trim())}`);
      return;
    }
    const result = await mentor.mutateAsync({ question: question.trim() });
    setAnswer(result?.answer || result?.response || "The mentor did not return an answer.");
  }

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-16 w-1/2" /><Skeleton className="h-[520px] rounded-3xl" /></div>;
  if (query.error && !isNotFound) return <EmptyState title="Roadmap unavailable" description={query.error.message} action={<Button variant="outline" onClick={() => query.refetch()}>Try again</Button>} />;
  if (generate.isPending) return <GenerationProgress />;

  if (isSetup) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 pb-12">
        <PageHeader title="Build Your Personalized Career Roadmap" description="Discover the skills you need, follow a personalized learning journey, and move closer to your target career." actions={<Button variant="ghost" onClick={() => navigate(`/resumes/${id}`)}><ArrowLeft size={15} /> Resume details</Button>} />
        <Card variant="accent" className="relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#A795FF]/20 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10"><WandSparkles size={22} /></div>
            <div><h2 className="font-display text-2xl font-semibold">A roadmap grounded in your resume</h2><p className="mt-1 max-w-2xl text-sm text-white/65">Choose a target role. HireSense will identify demonstrated skills, honest gaps, and practical milestones without assuming that a keyword proves expertise.</p></div>
          </div>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Target-job setup</CardTitle><CardDescription>Only enter what is not already available in your resume.</CardDescription></div><Target className="text-[var(--accent-strong)]" size={20} /></CardHeader>
          <form onSubmit={createRoadmap} className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2 text-sm font-medium">Target job role<Input className="mt-2" placeholder="e.g. Machine Learning Engineer" value={setup.targetRole} onChange={(e) => updateSetup("targetRole", e.target.value)} required /></label>
            <label className="md:col-span-2 text-sm font-medium">Optional job description<textarea className="mt-2 min-h-32 w-full rounded-2xl border bg-[var(--surface-2)] p-4 text-sm outline-none focus:border-[var(--accent)]" placeholder="Paste a specific job description for evidence-based gap analysis." value={setup.jobDescription} onChange={(e) => updateSetup("jobDescription", e.target.value)} maxLength={12000} /></label>
            <label className="md:col-span-2 text-sm font-medium">Existing resume skills <textarea readOnly className="mt-2 min-h-20 w-full rounded-2xl border bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-muted)] outline-none" value={resumeSkills.join(", ") || "Skills will be read from the selected resume version during generation."} /></label>
            <label className="text-sm font-medium">Experience level<select className="mt-2 h-10 w-full rounded-full border bg-[var(--surface)] px-4 text-sm" value={setup.experienceLevel} onChange={(e) => updateSetup("experienceLevel", e.target.value)}><option value="beginner">Complete beginner</option><option value="basic">Basic knowledge</option><option value="intermediate">Intermediate</option><option value="experienced">Experienced professional</option><option value="career_switcher">Career switcher</option></select></label>
            <label className="text-sm font-medium">Preferred duration<select className="mt-2 h-10 w-full rounded-full border bg-[var(--surface)] px-4 text-sm" value={setup.durationDays} onChange={(e) => updateSetup("durationDays", Number(e.target.value))}><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option><option value="120">120 days</option></select></label>
            <label className="text-sm font-medium">Study time per day<select className="mt-2 h-10 w-full rounded-full border bg-[var(--surface)] px-4 text-sm" value={setup.studyMinutesPerDay} onChange={(e) => updateSetup("studyMinutesPerDay", Number(e.target.value))}><option value="30">30 minutes</option><option value="60">1 hour</option><option value="90">90 minutes</option><option value="120">2 hours</option></select></label>
            <label className="text-sm font-medium">Learning style<select className="mt-2 h-10 w-full rounded-full border bg-[var(--surface)] px-4 text-sm" value={setup.learningStyle} onChange={(e) => updateSetup("learningStyle", e.target.value)}><option value="project_based">Project based</option><option value="structured">Structured lessons</option><option value="practice_first">Practice first</option><option value="mixed">A mix of everything</option></select></label>
            <label className="text-sm font-medium">Preferred language<select className="mt-2 h-10 w-full rounded-full border bg-[var(--surface)] px-4 text-sm" value={setup.learningLanguage} onChange={(e) => updateSetup("learningLanguage", e.target.value)}><option value="English">English</option><option value="Hindi">Hindi</option><option value="Hinglish">Hinglish</option></select></label>
            <label className="md:col-span-2 text-sm font-medium">Preferred technology or specialization <span className="font-normal text-[var(--ink-muted)]">(optional)<Input className="mt-2" placeholder="e.g. Python, Azure, product analytics" value={setup.specialization} onChange={(e) => updateSetup("specialization", e.target.value)} /></span></label>
            <div className="md:col-span-2 flex justify-end"><Button type="submit" variant="accent" size="lg" disabled={generate.isPending}>{generate.isPending ? <><Loader2 size={16} className="animate-spin" /> Analyzing your resume…</> : <><Sparkles size={16} /> Create My Career Roadmap <ArrowRight size={16} /></>}</Button></div>
          </form>
        </Card>
      </div>
    );
  }

  function GenerationProgress() {
    const stages = [
      "Reading your resume",
      "Identifying existing skills",
      "Analyzing target job requirements",
      "Finding skill gaps",
      "Designing weekly learning milestones",
      "Preparing learning resources",
      "Saving your career roadmap",
    ];
    return (
      <div className="mx-auto max-w-2xl space-y-8 pb-12">
        <PageHeader title="Building your career roadmap" description="HireSense is grounding each milestone in your resume and target role." />
        <Card>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  {index === 0 ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} />}
                </span>
                <span className="text-sm">{stage}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-[var(--ink-muted)]">This may take a moment while the AI validates and saves your personalized plan.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="My Career Growth Ladder" description={`${targetJob || "Target role"} · Resume-grounded learning plan`} actions={<Button variant="ghost" onClick={() => navigate(`/resumes/${roadmap.resumeId || id}`)}><ArrowLeft size={15} /> Resume details</Button>} />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
        <Card variant="accent" className="overflow-hidden"><div className="flex items-start justify-between gap-4"><div><Badge className="border-white/20 bg-white/10 text-white">Adaptive roadmap</Badge><h2 className="mt-4 font-display text-3xl font-semibold">{targetJob}</h2><p className="mt-2 max-w-xl text-sm text-white/65">Move from demonstrated evidence to practical proof. Checking a task complete never replaces assessment or project verification.</p></div><Trophy className="text-[#B6CFC0]" size={28} /></div><div className="mt-7 flex flex-wrap gap-8"><div><div className="font-display text-3xl font-semibold">{progressPercent}%</div><div className="text-xs text-white/55">Learning completion</div></div><div><div className="font-display text-3xl font-semibold">{milestones.length}</div><div className="text-xs text-white/55">Milestones</div></div><div><div className="font-display text-3xl font-semibold">{roadmap.skillGaps?.length || 0}</div><div className="text-xs text-white/55">Skill gaps to close</div></div></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-[#B6CFC0]" animate={{ width: `${progressPercent}%` }} /></div></Card>
        <Card><CardHeader><div><CardTitle>Resume-grounded gaps</CardTitle><CardDescription>Evidence status from your selected version.</CardDescription></div><Layers3 size={19} className="text-[var(--accent-strong)]" /></CardHeader><div className="space-y-3">{(roadmap.skillGaps || []).slice(0, 5).map((gap, index) => <div key={gap.skill || index} className="flex items-center justify-between gap-3 text-sm"><span>{gap.skill || gap.name}</span><Badge tone={gap.currentLevel === "advanced" ? "success" : "warning"}>{gap.currentLevel || "needs practice"}</Badge></div>)}{!roadmap.skillGaps?.length && <p className="text-sm text-[var(--ink-muted)]">Skill analysis will appear with the generated milestones.</p>}</div></Card>
      </div>
      <LearningCalendar roadmap={roadmap} onDateChange={setJournalDate} />
      <DailyJournal key={journalDate} roadmapId={roadmap._id} noteDate={journalDate} />
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="relative overflow-hidden"><CardHeader><div><CardTitle>Milestones</CardTitle><CardDescription>Your path upward, one verified step at a time.</CardDescription></div><Sparkles size={18} className="text-[var(--accent-strong)]" /></CardHeader><div className="relative space-y-3 pl-5 before:absolute before:bottom-4 before:left-[37px] before:top-4 before:w-px before:bg-[var(--border)]">{milestones.map((milestone, index) => { const done = milestone.status === "completed" || milestone.completed; const current = index === selected; return <motion.button type="button" key={milestone._id || milestone.id || index} onClick={() => setSelected(index)} whileHover={{ x: 4 }} className={`relative flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${current ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--surface-2)]"}`}><span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${done ? "border-[var(--success)] bg-[var(--success)] text-white" : current ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)]"}`}>{done ? <Check size={15} /> : index + 1}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{milestone.title || milestone.objective || `Milestone ${index + 1}`}</span><span className="mt-0.5 block truncate text-xs text-[var(--ink-muted)]">{milestone.weekLabel || `Stage ${index + 1}`} · {milestone.status || "available"}</span></span></motion.button>; })}</div></Card>
        <Card><CardHeader><div><CardTitle>{active?.title || active?.objective || "Select a milestone"}</CardTitle><CardDescription>{active?.connectionToRole || active?.description || "Your next learning step."}</CardDescription></div><Badge tone="accent">{active?.estimatedHours ? `${active.estimatedHours}h` : "Active"}</Badge></CardHeader>{active && <><div className="grid gap-3 sm:grid-cols-3">{[["Objective", active.objective || active.goals?.join(", ")], ["Topics", (active.topics || active.skills || []).join(", ")], ["Deliverable", active.deliverable || active.assessment]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[var(--surface-2)] p-4"><div className="text-xs uppercase tracking-wider text-[var(--ink-muted)]">{label}</div><div className="mt-2 text-sm leading-6">{value || "Not specified"}</div></div>)}</div><div className="mt-6 space-y-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><BookOpen size={16} className="text-[var(--accent-strong)]" /> Daily learning tracker</h3>{tasks.map((task, index) => <div key={task._id || task.id || index} className="rounded-2xl border border-[var(--border)] p-4 transition hover:bg-[var(--surface-2)]"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 accent-[var(--accent)]" checked={task.status === "completed"} onChange={() => toggleTask(task, index)} /><span className="min-w-0 flex-1"><span className={`block text-sm font-medium ${task.status === "completed" ? "text-[var(--ink-muted)] line-through" : ""}`}>{task.title || task.task || `Learning task ${index + 1}`}</span><span className="mt-1 block text-xs leading-5 text-[var(--ink-muted)]">{task.content || task.description || "Complete this learning activity and record what you learned."}</span></span><span className="flex shrink-0 items-center gap-1 text-xs text-[var(--ink-muted)]"><Clock3 size={13} />{task.estimatedMinutes || 30}m</span></label><div className="mt-3 flex gap-2 pl-7"><Input value={taskNotes[task._id] ?? task.notes ?? ""} onChange={(e) => setTaskNotes((current) => ({ ...current, [task._id]: e.target.value }))} placeholder="Add a personal note..." className="h-8 text-xs" /><Button type="button" size="sm" variant="ghost" onClick={() => saveTaskNotes(task)}>Save note</Button></div></div>)}{!tasks.length && <p className="text-sm text-[var(--ink-muted)]">No daily tasks were generated for this milestone.</p>}</div><div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><Check size={16} className="text-[var(--success)]" /> Milestone assessment</h3><p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">{active.assessment || "Write what you can now explain or demonstrate. This is separate from task completion."}</p><form onSubmit={submitAssessment} className="mt-3 flex gap-2"><Input value={assessmentAnswer} onChange={(e) => setAssessmentAnswer(e.target.value)} placeholder="Describe your evidence or reflection..." /><Button type="submit" variant="outline" disabled={assessment.isPending}>Submit</Button></form></div><div className="mt-6 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><MessageCircle size={16} /> Ask Career Mentor AI</h3><form onSubmit={askMentor} className="mt-3 flex gap-2"><Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about this milestone..." /><Button type="submit" size="icon" variant="accent" disabled={mentor.isPending}>{mentor.isPending ? <Loader2 className="animate-spin" size={15} /> : <ArrowRight size={15} />}</Button></form>{answer && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-muted)]">{answer}</p>}</div></>}</Card>
      </div>
    </div>
  );
}
