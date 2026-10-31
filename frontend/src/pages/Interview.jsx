import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  History,
  Mic,
  MicOff,
  MessageCircleQuestion,
  Volume2,
  VolumeX,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useResumesList } from "@/hooks/useResumes";
import {
  useAnswerInterview,
  useCreateInterview,
  useFinishInterview,
  useInterview,
  useInterviews,
} from "@/hooks/useInterviews";

const difficultyTone = {
  beginner: "success",
  intermediate: "accent",
  advanced: "danger",
};

function Score({ value }) {
  return (
    <span className="font-display text-2xl font-semibold text-[var(--ink)]">
      {value ?? "—"}<span className="text-sm text-[var(--ink-muted)]">/100</span>
    </span>
  );
}

function Report({ session }) {
  const report = session.report;
  return (
    <div className="space-y-5">
      <Card variant="accent" className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-white/75 text-xs uppercase tracking-wider">
            <Sparkles size={14} /> Personalized report
          </div>
          <h2 className="font-display text-2xl font-semibold mt-3">{report?.summary || "Interview complete"}</h2>
          <div className="flex items-end gap-3 mt-5">
            <span className="text-5xl font-display font-semibold">{session.performance.averageScore}</span>
            <span className="text-sm text-white/70 pb-2">average score</span>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(report?.strengths || []).map((item) => <div key={item} className="flex gap-2 text-sm"><CheckCircle2 size={16} className="text-[var(--success)] shrink-0 mt-0.5" />{item}</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Weak concepts</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {session.weakConcepts.length ? session.weakConcepts.map((item) => <Badge key={item} tone="warning">{item}</Badge>) : <p className="text-sm text-[var(--ink-muted)]">No recurring weak concepts identified.</p>}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Revision recommendations</CardTitle><CardDescription>Use these before your next interview session.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {(session.recommendations || []).map((item, index) => <div key={item} className="flex gap-3 text-sm"><span className="h-6 w-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center text-xs font-semibold">{index + 1}</span><span>{item}</span></div>)}
        </CardContent>
      </Card>
    </div>
  );
}

function Setup({ resumes, onStart, isPending }) {
  const [resumeId, setResumeId] = useState(resumes[0]?._id || "");
  const [targetJob, setTargetJob] = useState("");
  const [skills, setSkills] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questionLimit, setQuestionLimit] = useState(8);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg">Set up your interview</CardTitle>
          <CardDescription className="mt-1">Gemini will use your selected resume, role, and skills to build a unique interview.</CardDescription>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center"><BrainCircuit size={20} /></div>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block text-xs font-medium text-[var(--ink-muted)]">Resume
          <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} className="mt-1 h-10 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--ink)] outline-none">
            {resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.title}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-[var(--ink-muted)]">Target job
          <Input className="mt-1" value={targetJob} onChange={(event) => setTargetJob(event.target.value)} placeholder="e.g. Senior React Engineer" />
        </label>
        <label className="block text-xs font-medium text-[var(--ink-muted)]">Technical skills <span className="font-normal">(comma separated)</span>
          <Input className="mt-1" value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="React, Node.js, MongoDB, system design" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[var(--ink-muted)]">Starting difficulty
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1 h-10 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--ink)] outline-none">
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--ink-muted)]">Questions
            <Input className="mt-1" type="number" min="1" max="20" value={questionLimit} onChange={(event) => setQuestionLimit(Number(event.target.value))} />
          </label>
        </div>
        <Button className="w-full" variant="accent" size="lg" disabled={isPending || !resumeId || targetJob.trim().length < 2} onClick={() => onStart({ resumeId, targetJob, technicalSkills: skills.split(",").map((item) => item.trim()).filter(Boolean), difficulty, questionLimit })}>
          {isPending ? "Generating your first question..." : "Start personalized interview"} <ChevronRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}

function Session({ session, onFinish, isAnswering, onAnswer }) {
  const currentQuestion = session.questions.find((question) => !question.answer);
  const [answer, setAnswer] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const voiceSupported = typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const recognitionRef = useRef(null);
  const answerRef = useRef("");
  const voiceBaseRef = useRef("");
  const finalVoiceRef = useRef("");
  const usedVoiceRef = useRef(false);
  const lastAnswered = [...session.questions].reverse().find((question) => question.answer);
  const answeredCount = session.questions.filter((question) => question.answer).length;

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return undefined;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          finalTranscript += event.results[index][0].transcript;
        } else {
          interimTranscript += event.results[index][0].transcript;
        }
      }
      finalVoiceRef.current = `${finalVoiceRef.current} ${finalTranscript}`.trim();
      const nextAnswer = `${voiceBaseRef.current} ${finalVoiceRef.current} ${interimTranscript}`.trim();
      usedVoiceRef.current = true;
      answerRef.current = nextAnswer;
      setAnswer(nextAnswer);
    };
    recognition.onerror = (event) => {
      setVoiceError(
        event.error === "not-allowed"
          ? "Microphone permission was denied. Allow microphone access and try again."
          : `Voice transcription stopped: ${event.error}.`,
      );
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  useEffect(() => {
    if (!voiceMode || !currentQuestion?.prompt || !window.speechSynthesis) return undefined;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion.prompt);
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [currentQuestion?.prompt, voiceMode]);

  function toggleListening() {
    setVoiceError("");
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      voiceBaseRef.current = answerRef.current;
      finalVoiceRef.current = "";
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      setVoiceError(`Unable to start microphone: ${error.message}`);
    }
  }

  function submitAnswer() {
    onAnswer({
      questionId: currentQuestion._id,
      answer,
      answerSource: usedVoiceRef.current ? "voice" : "text",
    });
    recognitionRef.current?.stop();
    setIsListening(false);
    setAnswer("");
    answerRef.current = "";
    usedVoiceRef.current = false;
  }

  if (!currentQuestion || session.status === "completed") return <Report session={session} />;
  return (
    <div className="space-y-5">
      {lastAnswered?.evaluation && (
        <Card className="border-[var(--accent)]/25">
          <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--success)]" /> Previous answer feedback</CardTitle><Score value={lastAnswered.evaluation.overallScore} /></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="md:col-span-2 text-[var(--ink-muted)]">{lastAnswered.evaluation.feedback}</div>
            <div className="text-xs text-[var(--ink-muted)]">Model answer<div className="text-[var(--ink)] mt-1">{lastAnswered.evaluation.modelAnswer}</div></div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2 mb-2"><Badge tone={difficultyTone[currentQuestion.difficulty]}>{currentQuestion.difficulty}</Badge><Badge>{currentQuestion.type}</Badge><span className="text-xs text-[var(--ink-muted)]">Question {answeredCount + 1} of {session.questionLimit}</span></div>
            <CardTitle className="text-xl leading-snug">{currentQuestion.prompt}</CardTitle>
            <CardDescription className="mt-2">Focus: {currentQuestion.focus}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {voiceMode && <Volume2 className="text-[var(--accent-strong)]" size={18} />}
            <MessageCircleQuestion className="text-[var(--accent-strong)]" />
          </div>
        </CardHeader>
        <CardContent>
          <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={7} placeholder="Think aloud. Explain your reasoning, trade-offs, and concrete examples..." className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/15 resize-y" />
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Button
              type="button"
              size="sm"
              variant={voiceMode ? "soft" : "outline"}
              onClick={() => setVoiceMode((enabled) => !enabled)}
              disabled={!voiceSupported && !window.speechSynthesis}
            >
              {voiceMode ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {voiceMode ? "Voice interviewer on" : "Enable voice interviewer"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isListening ? "accent" : "outline"}
              onClick={toggleListening}
              disabled={!voiceSupported}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              {isListening ? "Stop transcription" : "Answer with microphone"}
            </Button>
            {!voiceSupported && <span className="text-xs text-[var(--ink-muted)]">Live transcription is unavailable in this browser.</span>}
            {isListening && <span className="text-xs text-[var(--accent-strong)]">Listening… speak naturally, then edit the transcript before submitting.</span>}
          </div>
          {voiceError && <p className="text-xs text-[var(--danger)] mt-2">{voiceError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <span className="text-xs text-[var(--ink-muted)]">Answers are evaluated for correctness, relevance, clarity, and depth.</span>
            <div className="flex gap-2"><Button variant="outline" disabled={isAnswering || answer.trim().length < 10} onClick={submitAnswer}>{isAnswering ? "Evaluating..." : "Submit answer"} <ChevronRight size={15} /></Button><Button variant="soft" disabled={isAnswering || answeredCount < 1} onClick={onFinish}>Finish and generate report</Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryList({ sessions, onOpen }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><History size={16} /> Previous sessions</CardTitle><CardDescription>Performance across your personalized interviews.</CardDescription></CardHeader><CardContent className="space-y-2">{sessions.slice(0, 6).map((session) => <button key={session._id} onClick={() => onOpen(session._id)} className="w-full flex items-center justify-between gap-3 rounded-xl p-3 text-left hover:bg-[var(--surface-2)] transition-colors"><span><span className="block text-sm font-medium text-[var(--ink)]">{session.targetJob}</span><span className="text-xs text-[var(--ink-muted)]">{session.status} · {session.performance?.answered || 0} answers</span></span><span className="flex items-center gap-3"><Score value={session.performance?.averageScore} /><ChevronRight size={15} className="text-[var(--ink-muted)]" /></span></button>)}</CardContent></Card>;
}

export default function Interview() {
  const { data: resumes = [], isLoading: resumesLoading } = useResumesList();
  const { data: sessions = [] } = useInterviews();
  const [sessionId, setSessionId] = useState(null);
  const createInterview = useCreateInterview();
  const answerInterview = useAnswerInterview();
  const finishInterview = useFinishInterview();
  const { data: session } = useInterview(sessionId);
  const currentSession = session || (sessionId ? null : null);
  const hasResumes = resumes.length > 0;
  const latest = useMemo(() => sessions[0], [sessions]);

  if (resumesLoading) return <div className="text-sm text-[var(--ink-muted)]">Loading interview workspace...</div>;
  if (!hasResumes) return <EmptyState icon={Target} title="Upload a resume first" description="Your mock interview questions are personalized from your resume. Upload one before starting." />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--accent-strong)] font-medium"><BrainCircuit size={14} /> Dynamic interview engine</div><h1 className="font-display text-3xl font-semibold tracking-tight mt-2">AI Mock Interview</h1><p className="text-sm text-[var(--ink-muted)] mt-1 max-w-2xl">Practice questions grounded in your resume and target role. Difficulty adapts after every answer.</p></div>
        {session && <Button variant="outline" onClick={() => setSessionId(null)}>New interview</Button>}
      </div>
      {currentSession ? <Session session={currentSession} onFinish={() => finishInterview.mutate(sessionId)} isAnswering={answerInterview.isPending} onAnswer={(payload) => answerInterview.mutate({ id: sessionId, payload })} /> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]"><Setup resumes={resumes} onStart={(payload) => createInterview.mutate(payload, { onSuccess: (data) => setSessionId(data.session._id) })} isPending={createInterview.isPending} /><div className="space-y-5"><Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp size={16} /> What gets evaluated</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-[var(--ink-muted)]"><div className="flex gap-3"><Sparkles size={16} className="text-[var(--accent-strong)]" />Technical correctness and depth</div><div className="flex gap-3"><MessageCircleQuestion size={16} className="text-[var(--accent-strong)]" />Clarity and relevance</div><div className="flex gap-3"><Target size={16} className="text-[var(--accent-strong)]" />Weak concepts and revision plan</div></CardContent></Card>{latest && <HistoryList sessions={sessions} onOpen={setSessionId} />}</div></div>}
      {!sessionId && sessions.length > 0 && !latest && null}
    </div>
  );
}
