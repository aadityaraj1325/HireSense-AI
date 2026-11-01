import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Reactive Audio Frequency Visualizer Waveform
 *
 * Renders dynamic vertical bars whose heights react to mic / speech audio level.
 */
export function AudioWaveform({ audioLevel = 0, isActive = false, barCount = 18, tone = "accent" }) {
  // Deterministic heights scaled by audioLevel (0 to 100)
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      // Natural sinusoidal frequency curve peaked towards middle
      const curve = Math.sin((i / (barCount - 1)) * Math.PI);
      const minHeight = 4;
      const effectiveLevel = audioLevel > 0 ? audioLevel : isActive ? 8 : 0;
      const dynamicHeight = Math.max(minHeight, Math.round(curve * (effectiveLevel * 0.45) + (isActive ? 6 : 2)));
      return {
        id: i,
        height: Math.min(36, dynamicHeight),
      };
    });
  }, [audioLevel, isActive, barCount]);

  const barColor =
    tone === "accent"
      ? "bg-gradient-to-t from-[var(--accent)] to-emerald-300"
      : tone === "blue"
      ? "bg-gradient-to-t from-blue-600 to-cyan-300"
      : "bg-gradient-to-t from-neutral-500 to-neutral-300";

  return (
    <div className="flex items-center justify-center gap-1 h-10 px-3 py-1 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className={`w-1 rounded-full ${barColor}`}
          animate={{ height: `${bar.height}px` }}
          transition={{ duration: 0.08, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

