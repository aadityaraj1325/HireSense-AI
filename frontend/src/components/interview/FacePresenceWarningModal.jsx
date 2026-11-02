import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, ShieldAlert, Camera, Eye, ArrowRight, Compass } from "lucide-react";

export function FacePresenceWarningModal({
  isOpen,
  warningCount = 1,
  maxWarnings = 3,
  secondsAbsent = 2,
  isTerminating = false,
  warningReason = "no_face",
  directionLabel = "Looking Away",
}) {
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  // Play continuous background warning alarm sound while warning is active
  useEffect(() => {
    if (isOpen) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const playAlarmBeep = () => {
          if (!ctx || ctx.state === "closed") return;
          try {
            if (ctx.state === "suspended") ctx.resume().catch(() => {});

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            // Two-tone security alarm siren (880Hz to 620Hz)
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(622.25, now + 0.12);

            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

            osc.start(now);
            osc.stop(now + 0.32);
          } catch (_) {}
        };

        // Play immediately, then repeat every 650ms for background security alarm
        playAlarmBeep();
        intervalRef.current = setInterval(playAlarmBeep, 650);
      } catch (err) {
        console.warn("Audio alarm warning notice:", err);
      }
    } else {
      // Instantly stop alarm when warning is dismissed (candidate returns face forward)
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch (_) {}
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch (_) {}
        audioCtxRef.current = null;
      }
    };
  }, [isOpen, warningCount]);

  const isMotion = warningReason === "head_turned" || warningReason === "motion_warning";
  const isHeadTurn = isMotion;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 border-2 text-center shadow-2xl overflow-hidden ${
              isTerminating
                ? "bg-red-950 border-red-500 shadow-red-500/30 text-white"
                : "bg-zinc-950 border-red-500/80 shadow-red-500/20 text-white"
            }`}
          >
            {/* Top Glowing Ambient Aura */}
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Warning Icon Badge */}
            <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 animate-bounce">
              <ShieldAlert size={36} />
            </div>

            {/* Warning Count Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase mb-3 bg-red-500/20 border border-red-500/40 text-red-300">
              <AlertOctagon size={13} className="animate-spin" />
              <span>
                {isTerminating
                  ? "Auto-Submitting Interview"
                  : `Proctoring Warning (${warningCount} of ${maxWarnings})`}
              </span>
            </div>

            {/* Title & Guidance */}
            <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isTerminating
                ? "Session Auto-Submitting"
                : isMotion
                ? `${directionLabel}!`
                : "Face Not Visible in Camera!"}
            </h3>

            <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
              {isTerminating
                ? "You have reached 3 visual proctoring strikes. The interview session is automatically submitting now."
                : isMotion
                ? `Proctoring Alert: ${directionLabel}. Please face forward directly toward your camera to dismiss this warning immediately.`
                : `Your face has not been detected for ${secondsAbsent} seconds. Please position your face directly inside the camera frame immediately.`}
            </p>

            {/* Warning Strikes Tracker Bar */}
            <div className="my-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                <span>Proctoring Strikes</span>
                <span className="font-mono text-white font-bold">{warningCount} / {maxWarnings}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((strike) => (
                  <div
                    key={strike}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      strike <= warningCount
                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                <span>Strike 1: Warning</span>
                <span>Strike 2: Final Notice</span>
                <span className="text-red-400 font-semibold">Strike 3: Auto-Submit</span>
              </div>
            </div>

            {/* Active Instructions / Recovery Hint */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isHeadTurn
                  ? "Look forward at your screen to instantly clear this alarm."
                  : "Align your face in the camera to resume your interview."}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
