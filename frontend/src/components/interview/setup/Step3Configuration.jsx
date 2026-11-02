import {
  BrainCircuit,
  Sliders,
  Clock,
  Volume2,
  Sparkles,
  ShieldCheck,
  Zap,
  Target,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const INTERVIEW_TYPES = [
  { id: "technical", label: "Technical Deep-Dive", desc: "Core algorithms, data structures & code implementation trade-offs" },
  { id: "project", label: "Project Defense & STAR", desc: "In-depth technical interrogation of your specific built resume projects" },
  { id: "system_design", label: "System Design & Scaling", desc: "Distributed architectures, microservices, caches & bottleneck handling" },
  { id: "behavioral", label: "Behavioral & Leadership", desc: "Conflict resolution, cross-functional ownership & engineering culture" },
  { id: "mixed", label: "Comprehensive Mixed Round", desc: "Realistic blend of technical, architectural, and behavioral challenges" },
];

const DIFFICULTIES = [
  { id: "adaptive", label: "Adaptive (Recommended)", desc: "Dynamically shifts difficulty based on the depth of your answers", badge: "AI Driven" },
  { id: "beginner", label: "Beginner / Junior", desc: "Foundational conceptual definitions, standard APIs & basic syntax" },
  { id: "intermediate", label: "Intermediate", desc: "Production code patterns, asynchronous state, concurrency & testing" },
  { id: "advanced", label: "Advanced / Staff", desc: "Fault tolerance, distributed consensus, sub-millisecond latencies & scale" },
];

const DURATIONS = [
  { minutes: 15, label: "15 min", questions: 5, tag: "Express" },
  { minutes: 30, label: "30 min", questions: 8, tag: "Standard" },
  { minutes: 45, label: "45 min", questions: 10, tag: "Comprehensive" },
  { minutes: 60, label: "60 min", questions: 12, tag: "Deep Dive" },
];

const PERSONALITIES = [
  { id: "professional", label: "Professional", desc: "Objective, balanced, structured tech lead. Focuses on clarity and sound reasoning." },
  { id: "friendly", label: "Warm & Supportive", desc: "Encouraging mentor persona. Gives hints and prompts when you hesitate." },
  { id: "strict", label: "Strict & Rigorous", desc: "Critical senior architect. Digs into edge cases and requires precise answers." },
  { id: "challenging", label: "FAANG Staff Level", desc: "High-intensity stress testing. Challenges architectural assumptions." },
];

export function Step3Configuration({
  interviewType,
  onChangeInterviewType,
  difficulty,
  onChangeDifficulty,
  duration,
  onChangeDuration,
  personality,
  onChangePersonality,
  language = "en-US",
  onChangeLanguage,
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-strong)]">
          Step 3 • Protocol Calibration
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mt-0.5">
          Interview Configuration & Persona
        </h2>
        <p className="text-sm text-[var(--ink-muted)] mt-1">
          Customize the interview format, difficulty adaptation model, session length, and AI interviewer persona.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Interview Round Type */}
        <div>
          <label className="text-xs font-semibold text-[var(--ink)] block mb-2">
            Interview Round Format
          </label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTERVIEW_TYPES.map((type) => {
              const isSelected = interviewType === type.id;
              return (
                <div
                  key={type.id}
                  onClick={() => onChangeInterviewType(type.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                      : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]/40"
                  }`}
                >
                  <div className="text-sm font-semibold text-[var(--ink)]">{type.label}</div>
                  <div className="text-xs text-[var(--ink-muted)] mt-1 leading-snug">{type.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Difficulty Level */}
        <div>
          <label className="text-xs font-semibold text-[var(--ink)] block mb-2">
            Assessment Difficulty Level
          </label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DIFFICULTIES.map((diff) => {
              const isSelected = difficulty === diff.id;
              return (
                <div
                  key={diff.id}
                  onClick={() => onChangeDifficulty(diff.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                    isSelected
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                      : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]/40"
                  }`}
                >
                  {diff.badge && (
                    <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--accent)] text-white">
                      {diff.badge}
                    </span>
                  )}
                  <div className="text-sm font-semibold text-[var(--ink)]">{diff.label}</div>
                  <div className="text-xs text-[var(--ink-muted)] mt-1 leading-snug">{diff.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Session Duration & Target Question Count */}
        <div>
          <label className="text-xs font-semibold text-[var(--ink)] block mb-2">
            Session Duration
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DURATIONS.map((dur) => {
              const isSelected = Number(duration) === dur.minutes;
              return (
                <div
                  key={dur.minutes}
                  onClick={() => onChangeDuration(dur.minutes)}
                  className={`p-3.5 rounded-2xl border cursor-pointer text-center transition-all ${
                    isSelected
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                      : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]/40"
                  }`}
                >
                  <div className="text-base font-bold text-[var(--ink)] flex items-center justify-center gap-1.5">
                    <Clock size={16} className="text-[var(--accent-strong)]" />
                    {dur.label}
                  </div>
                  <div className="text-xs text-[var(--ink-muted)] mt-0.5">
                    ~{dur.questions} Questions ({dur.tag})
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Interviewer Personality */}
        <div>
          <label className="text-xs font-semibold text-[var(--ink)] block mb-2">
            AI Interviewer Personality & Tone
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {PERSONALITIES.map((p) => {
              const isSelected = personality === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onChangePersonality(p.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                      : "bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]/40"
                  }`}
                >
                  <div className="text-sm font-semibold text-[var(--ink)]">{p.label}</div>
                  <div className="text-xs text-[var(--ink-muted)] mt-1 leading-snug">{p.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

