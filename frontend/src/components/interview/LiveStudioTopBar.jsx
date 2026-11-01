import { useEffect, useState } from "react";
import { Clock, ShieldAlert, Award, FileText, CheckCircle2, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LiveStudioTopBar({
  targetRole = "Software Engineer",
  companyName = "Target Company",
  currentDifficulty = "Adaptive",
  durationMinutes = 30,
  onEndInterview,
  onToggleTranscript,
  transcriptOpen = false,
  isEnding = false,
}) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const targetSecs = durationMinutes * 60;
  const remainingSecs = Math.max(0, targetSecs - secondsElapsed);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
      {/* Role & Company Badges */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30 font-semibold shadow-inner">
          <Award size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--ink)] tracking-tight">{targetRole}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--border)]">
              {companyName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Live Studio
            </span>
            <span>•</span>
            <span className="capitalize font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              {currentDifficulty} Level
            </span>
          </div>
        </div>
      </div>

      {/* Center Timer */}
      <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--ink)]">
          <Clock size={14} className="text-[var(--accent)]" />
          <span>{formatTime(secondsElapsed)}</span>
          <span className="text-[var(--ink-muted)]">/ {durationMinutes}:00</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleTranscript}
          className={`gap-1.5 text-xs ${transcriptOpen ? "bg-[var(--surface-2)] border-[var(--accent)]" : ""}`}
        >
          <FileText size={14} />
          <span>{transcriptOpen ? "Hide Transcript" : "Show Transcript"}</span>
        </Button>

        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onEndInterview}
          disabled={isEnding}
          className="gap-1.5 text-xs font-semibold shadow-sm"
        >
          <PhoneOff size={14} />
          <span>{isEnding ? "Compiling Report..." : "End Interview"}</span>
        </Button>
      </div>
    </header>
  );
}

