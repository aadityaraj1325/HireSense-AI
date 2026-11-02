import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, BrainCircuit } from "lucide-react";

export function InterviewCountdownOverlay({
  onCountdownComplete,
  targetRole = "Software Engineer",
}) {
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count <= 0) {
      onCountdownComplete();
      return;
    }

    const timer = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [count, onCountdownComplete]);

  // Stroke dash offset calculation for circular ring (radius = 80, perimeter = 2 * PI * 80 ≈ 502.65)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (count / 10) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md text-white select-none">
      <div className="text-center space-y-6 max-w-md px-6">
        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-semibold text-emerald-400">
          <BrainCircuit size={14} className="animate-spin" />
          <span>HireSense AI • Live Interview Protocol Active</span>
        </div>

        {/* Animated Countdown Circle */}
        <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="104"
              cy="104"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-white/10"
            />
            {/* Animated Progress Ring */}
            <motion.circle
              cx="104"
              cy="104"
              r={radius}
              stroke="url(#countdownGradient)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "linear" }}
            />
            <defs>
              <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={count}
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.4, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="font-display text-7xl font-extrabold tracking-tighter text-white"
              >
                {count > 0 ? count : "Go!"}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Guidance Text */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Your interview is about to begin
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Please look toward your camera, check your posture, and get comfortable. The AI interviewer will greet you aloud once the countdown finishes.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
            <Camera size={13} className="text-emerald-400" />
            <span>Camera stream verified & ready</span>
          </div>

          <button
            type="button"
            onClick={onCountdownComplete}
            className="text-xs px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/15 transition-all cursor-pointer"
          >
            Skip Countdown & Start Now →
          </button>
        </div>
      </div>
    </div>
  );
}

