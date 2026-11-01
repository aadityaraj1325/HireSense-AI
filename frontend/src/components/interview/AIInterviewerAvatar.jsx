import { motion } from "framer-motion";
import { Mic, Volume2, Sparkles, AlertCircle, Cpu } from "lucide-react";

/**
 * AI Interviewer Bioluminescent Avatar
 *
 * Dynamically reacts to interview voice state:
 * - AI_SPEAKING: Pulsating emerald-cyan acoustic aura with rippling shockwaves
 * - LISTENING: Deep serene cobalt glow, attentive iris focus
 * - PROCESSING: Orbiting neural spark loop
 * - INTERRUPTED: Amber-gold quick pulse transition
 */
export function AIInterviewerAvatar({ voiceState, interviewerPersonality = "Professional", activeTopic = "" }) {
  const isSpeaking = voiceState === "AI_SPEAKING";
  const isListening = voiceState === "LISTENING";
  const isProcessing = voiceState === "PROCESSING";
  const isInterrupted = voiceState === "INTERRUPTED";

  return (
    <div className="relative flex flex-col items-center justify-center py-6 select-none">
      {/* Outer Acoustic Ambient Aura */}
      <div className="relative flex items-center justify-center h-48 w-48 sm:h-56 sm:w-56">
        {/* Ripple 1 */}
        <motion.div
          className="absolute inset-0 rounded-full border border-[var(--accent)]/30 pointer-events-none"
          animate={{
            scale: isSpeaking ? [1, 1.45, 1.7] : isListening ? [1, 1.15, 1] : 1,
            opacity: isSpeaking ? [0.6, 0.25, 0] : isListening ? [0.3, 0.5, 0.3] : 0.1,
          }}
          transition={{
            duration: isSpeaking ? 2 : 2.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />

        {/* Ripple 2 (delayed phase) */}
        <motion.div
          className="absolute inset-4 rounded-full border border-emerald-400/20 pointer-events-none"
          animate={{
            scale: isSpeaking ? [1, 1.35, 1.55] : isListening ? [1, 1.1, 1] : 1,
            opacity: isSpeaking ? [0.7, 0.3, 0] : isListening ? [0.2, 0.4, 0.2] : 0.08,
          }}
          transition={{
            duration: isSpeaking ? 2 : 2.5,
            delay: isSpeaking ? 0.6 : 0,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />

        {/* Outer Glow Halo */}
        <motion.div
          className="absolute inset-6 rounded-full blur-2xl pointer-events-none transition-colors duration-500"
          style={{
            background: isSpeaking
              ? "radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(5, 150, 105, 0.15) 60%, transparent 80%)"
              : isListening
              ? "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.1) 60%, transparent 80%)"
              : isInterrupted
              ? "radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)",
          }}
          animate={{
            scale: isSpeaking ? [0.95, 1.15, 0.95] : [1, 1.05, 1],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core Holographic Sphere */}
        <motion.div
          className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full flex items-center justify-center shadow-2xl border border-white/20 overflow-hidden backdrop-blur-md"
          style={{
            background: isSpeaking
              ? "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 80%, #10b981 100%)"
              : isListening
              ? "linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #2563eb 80%, #3b82f6 100%)"
              : isInterrupted
              ? "linear-gradient(135deg, #78350f 0%, #b45309 60%, #f59e0b 100%)"
              : "linear-gradient(135deg, #111827 0%, #1f2937 60%, #374151 100%)",
          }}
          animate={{
            scale: isSpeaking ? [1, 1.04, 1] : 1,
            rotate: isProcessing ? 360 : 0,
          }}
          transition={
            isProcessing
              ? { duration: 4, repeat: Infinity, ease: "linear" }
              : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {/* Internal Iris Shimmer */}
          <motion.div
            className="absolute inset-2 rounded-full border border-white/30 flex items-center justify-center overflow-hidden"
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            {/* Geometric Core Hologram */}
            <div className="relative flex items-center justify-center">
              {isSpeaking ? (
                <Volume2 className="h-10 w-10 text-emerald-200 animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              ) : isListening ? (
                <Mic className="h-10 w-10 text-blue-200 animate-bounce drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              ) : isProcessing ? (
                <Cpu className="h-10 w-10 text-cyan-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              ) : isInterrupted ? (
                <AlertCircle className="h-10 w-10 text-amber-200" />
              ) : (
                <Sparkles className="h-10 w-10 text-emerald-300/80" />
              )}
            </div>
          </motion.div>

          {/* Shimmering specular highlight */}
          <div className="absolute top-2 left-3 h-8 w-12 rounded-full bg-white/20 blur-[3px] -rotate-45 pointer-events-none" />
        </motion.div>
      </div>

      {/* Voice Status Pill */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border shadow-sm transition-all duration-300 ${
            isSpeaking
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : isListening
              ? "bg-blue-500/10 text-blue-400 border-blue-500/30 ring-2 ring-blue-500/20"
              : isProcessing
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse"
              : isInterrupted
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-[var(--surface-2)] text-[var(--ink-muted)] border-[var(--border)]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isSpeaking
                ? "bg-emerald-400 animate-ping"
                : isListening
                ? "bg-blue-400 animate-pulse"
                : isProcessing
                ? "bg-cyan-400"
                : isInterrupted
                ? "bg-amber-400"
                : "bg-neutral-500"
            }`}
          />
          {isSpeaking
            ? "AI Interviewer Speaking..."
            : isListening
            ? "Listening to you... (Speak freely)"
            : isProcessing
            ? "Evaluating and preparing response..."
            : isInterrupted
            ? "Interrupted — Switching to you..."
            : "Live Interview Active"}
        </div>

        {/* Persona & Topic indicator */}
        <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
          <span>Persona: <strong className="text-[var(--ink)] capitalize">{interviewerPersonality}</strong></span>
          {activeTopic && (
            <>
              <span className="opacity-40">•</span>
              <span className="max-w-[280px] truncate font-medium text-[var(--accent-strong)]">{activeTopic}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

