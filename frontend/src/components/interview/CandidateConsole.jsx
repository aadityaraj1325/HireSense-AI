import { useState } from "react";
import {
  Mic,
  MicOff,
  Send,
  Hand,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Clock,
  Sparkles,
  HelpCircle,
  Pause,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AudioWaveform } from "./AudioWaveform";

export function CandidateConsole({
  voiceState,
  isMuted,
  audioLevel,
  interimTranscript,
  answerElapsedSeconds = 0,
  showTimeoutPrompt = false,
  onInterrupt,
  onToggleMute,
  onSubmitAnswer,
  onReplayQuestion,
  onPauseInterview,
  isProcessing = false,
}) {
  const [textModeOpen, setTextModeOpen] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [notice, setNotice] = useState(null);

  const isSpeaking = voiceState === "AI_SPEAKING";
  const isListening = voiceState === "LISTENING" || voiceState === "CANDIDATE_SPEAKING";
  const isCandidateTalking = voiceState === "CANDIDATE_SPEAKING";

  const handleSendText = (e) => {
    e.preventDefault();
    if (!typedAnswer.trim() || isProcessing) return;
    onSubmitAnswer(typedAnswer.trim());
    setTypedAnswer("");
    setNotice(null);
  };

  const formattedTimer = `${Math.floor(answerElapsedSeconds / 60)}:${String(
    answerElapsedSeconds % 60
  ).padStart(2, "0")}`;

  return (
    <div className="relative flex flex-col gap-3 p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
      {/* Polite Timeout Prompt (Phase 5: If no response after 20s, offer to repeat or take time) */}
      <AnimatePresence>
        {showTimeoutPrompt && isListening && !interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
              <HelpCircle size={15} className="shrink-0" />
              <span>Take your time. Would you like me to repeat the question?</span>
            </div>
            <div className="flex items-center gap-2">
              {onReplayQuestion && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onReplayQuestion}
                  className="text-xs h-7 gap-1 bg-[var(--surface)]"
                >
                  <RotateCcw size={12} /> Repeat Question
                </Button>
              )}
              {onPauseInterview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onPauseInterview}
                  className="text-xs h-7 gap-1 bg-[var(--surface)]"
                >
                  <Pause size={12} /> Pause
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTextModeOpen(true)}
                className="text-xs h-7 gap-1 bg-[var(--surface)]"
              >
                <MessageSquare size={12} /> Type Instead
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time live speech feedback bar */}
      <div className="flex items-center justify-between gap-3 min-h-[48px] px-4 py-2.5 rounded-2xl bg-[var(--surface-2)]/80 border border-[var(--border)]">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
              isCandidateTalking
                ? "bg-emerald-400 animate-ping"
                : isListening
                ? "bg-emerald-500 animate-pulse"
                : isMuted
                ? "bg-red-400"
                : "bg-neutral-400"
            }`}
          />
          <div className="min-w-0 flex-1">
            {interimTranscript ? (
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-[var(--ink)] font-semibold leading-relaxed break-words">
                  &ldquo;{interimTranscript}&rdquo;
                </p>
                {isListening && (
                  <span className="text-[10px] text-[var(--accent-strong)] block font-mono">
                    ● Listening... speak freely. Auto-submits on natural completion or click &ldquo;Done Speaking / Send&rdquo;
                  </span>
                )}
              </div>
            ) : isListening ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-medium">
                  {audioLevel > 8 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                      ● Hearing your voice... Speak your answer
                    </span>
                  ) : (
                    <span className="text-[var(--accent-strong)] font-semibold">
                      ● Your turn — speak now through your microphone
                    </span>
                  )}
                </p>
                {answerElapsedSeconds > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[var(--ink-muted)]">
                    <Clock size={11} /> {formattedTimer}
                    {answerElapsedSeconds < 10 && (
                      <span className="text-[10px] text-amber-600">(10s response window)</span>
                    )}
                  </span>
                )}
              </div>
            ) : isSpeaking ? (
              <p className="text-xs sm:text-sm text-[var(--ink-muted)]">
                AI Interviewer is speaking aloud. You can interrupt anytime.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-[var(--ink-muted)]">
                Ready. Speak into microphone to answer.
              </p>
            )}
          </div>
        </div>

        {/* Live Audio Waveform */}
        <div className="shrink-0 hidden sm:block">
          <AudioWaveform audioLevel={audioLevel} isActive={isListening} barCount={16} tone="accent" />
        </div>
      </div>

      {/* Main Tactile Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: Interruption / Pause Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onInterrupt}
            className={`gap-1.5 text-xs font-semibold rounded-xl ${
              isSpeaking
                ? "border-amber-500/50 text-amber-600 hover:bg-amber-500/10 animate-pulse"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Hand size={14} />
            <span>{isSpeaking ? "Interrupt AI Interviewer" : "Pause / Intervene"}</span>
          </Button>

          {onReplayQuestion && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReplayQuestion}
              title="Repeat the current interview question aloud"
              className="text-xs font-semibold rounded-xl text-[var(--ink-muted)] hover:text-[var(--ink)] gap-1"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Repeat Question</span>
            </Button>
          )}
        </div>

        {/* Center: Tactile Microphone & Done Speaking */}
        <div className="flex items-center gap-2.5">
          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all ${
              isMuted
                ? "bg-red-500/10 border-red-500/40 text-red-500 ring-2 ring-red-500/20"
                : isListening
                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)]"
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} className={isListening ? "animate-pulse" : ""} />}
          </button>

          {/* Submit / Done Speaking Button */}
          <Button
            type="button"
            variant="accent"
            size="md"
            disabled={isProcessing}
            onClick={() => {
              if (interimTranscript && interimTranscript.trim()) {
                onSubmitAnswer(interimTranscript.trim());
              } else if (typedAnswer && typedAnswer.trim()) {
                onSubmitAnswer(typedAnswer.trim());
              } else {
                setTextModeOpen(true);
                setNotice("Microphone hasn't caught words yet — please type your response below or speak clearly into your mic.");
              }
            }}
            className="gap-2 px-5 font-semibold text-xs sm:text-sm shadow-md cursor-pointer rounded-2xl"
          >
            <Send size={15} />
            <span>{isProcessing ? "Processing Answer..." : "Done Speaking / Send"}</span>
          </Button>
        </div>

        {/* Right: Toggle Accessible Text Fallback */}
        <div>
          <button
            type="button"
            onClick={() => setTextModeOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
          >
            <MessageSquare size={14} />
            <span>{textModeOpen ? "Hide Text Fallback" : "Type Answer Instead"}</span>
            {textModeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Accessible Text Fallback Drawer */}
      <AnimatePresence>
        {textModeOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSendText}
            className="overflow-hidden pt-2 border-t border-[var(--border)] mt-2"
          >
            <div className="flex flex-col gap-2">
              {notice && (
                <p className="text-xs text-amber-500 font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                  {notice}
                </p>
              )}
              <label htmlFor="typedAnswer" className="text-xs font-medium text-[var(--ink-muted)]">
                Type your answer (for quiet environments or microphone fallback):
              </label>
              <div className="flex gap-2">
                <textarea
                  id="typedAnswer"
                  rows={3}
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="Explain your approach, technical trade-offs, and project experience here..."
                  className="flex-1 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
                <Button
                  type="submit"
                  variant="accent"
                  disabled={!typedAnswer.trim() || isProcessing}
                  className="shrink-0 self-end text-xs gap-1.5"
                >
                  <Send size={14} /> Send
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
