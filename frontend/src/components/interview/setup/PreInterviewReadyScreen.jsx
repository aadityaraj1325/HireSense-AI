import {
  BrainCircuit,
  FileText,
  Briefcase,
  Sliders,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  User,
  ArrowRight,
  Video,
  Mic,
  Volume2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function PreInterviewReadyScreen({
  activeResume,
  targetRole,
  companyName,
  interviewType,
  difficulty,
  duration,
  personality,
  onStartCountdown,
  isInitializing,
}) {
  const candidateName =
    activeResume?.parsedData?.basics?.name || "Candidate";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent-strong)] border border-[var(--accent)]/30">
          <Sparkles size={14} /> Pre-Interview Protocol Verified
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
          You Are Ready to Begin
        </h2>
        <p className="text-sm text-[var(--ink-muted)] max-w-lg mx-auto">
          All technical verifications, hardware permissions, and AI grounding matrices are locked in. Review your interview parameters below before entering the studio.
        </p>
      </div>

      {/* Confirmation Summary Card */}
      <Card padding="lg" radius="xl" className="border-2 border-[var(--border)] bg-[var(--surface)] shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Candidate & Role Information */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {candidateName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)]">{candidateName}</h3>
                  <div className="text-xs text-[var(--ink-muted)] flex items-center gap-1">
                    <Briefcase size={12} />
                    <span>{targetRole}</span>
                    {companyName && <span>• {companyName}</span>}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-muted)] flex items-center gap-1.5">
                    <FileText size={13} /> Grounding Resume:
                  </span>
                  <span className="font-semibold text-[var(--ink)] truncate max-w-[180px]">
                    {activeResume?.title || "Active Resume"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-muted)]">Verified Skills Grounded:</span>
                  <span className="font-mono font-medium text-[var(--ink)]">
                    {activeResume?.parsedData?.skills?.length || 0} skills
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-muted)]">Project Defense Anchors:</span>
                  <span className="font-mono font-medium text-[var(--ink)]">
                    {activeResume?.parsedData?.projects?.length || 0} projects
                  </span>
                </div>
              </div>
            </div>

            {/* Session Parameters */}
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs">
              <div className="font-semibold text-[var(--ink)] uppercase tracking-wider text-[10px] font-mono">
                Round Specifications
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Round Type:</span>
                <span className="font-semibold text-[var(--ink)] capitalize">{interviewType} Round</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Difficulty Model:</span>
                <span className="font-semibold text-[var(--accent-strong)] capitalize">{difficulty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Allocated Duration:</span>
                <span className="font-semibold text-[var(--ink)] flex items-center gap-1">
                  <Clock size={12} /> {duration} minutes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Interviewer Persona:</span>
                <span className="font-semibold text-[var(--ink)] capitalize">{personality}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hardware & AI Readiness */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
              <div className="font-semibold text-[var(--ink)] uppercase tracking-wider text-[10px] font-mono">
                Hardware & Telemetry Status
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="flex items-center gap-2 text-[var(--ink)] font-medium">
                    <Video size={14} className="text-emerald-500" /> Camera Preview & Proctoring
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 size={13} /> Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="flex items-center gap-2 text-[var(--ink)] font-medium">
                    <Mic size={14} className="text-emerald-500" /> Microphone & Speech Engine
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 size={13} /> Tested
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="flex items-center gap-2 text-[var(--ink)] font-medium">
                    <Volume2 size={14} className="text-emerald-500" /> AI Spoken Audio Output
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 size={13} /> Ready
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="flex items-center gap-2 text-[var(--ink)] font-medium">
                    <BrainCircuit size={14} className="text-[var(--accent-strong)]" /> Gemini Adaptive Engine
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 size={13} /> Connected
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="accent"
                size="lg"
                onClick={onStartCountdown}
                disabled={isInitializing}
                className="w-full text-base font-bold py-6 rounded-2xl shadow-lg flex items-center justify-center gap-2"
              >
                {isInitializing ? (
                  <span>Initializing Secure Studio...</span>
                ) : (
                  <>
                    <span>Start Live Interview</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
              <p className="text-[11px] text-[var(--ink-muted)] text-center">
                Clicking start begins the 10-second preparation countdown before the live studio activates.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

