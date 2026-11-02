import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, HelpCircle, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, Scale } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GoalRealityScoreModal({ isOpen, onClose, realityScore = {} }) {
  if (!isOpen) return null;

  const score = realityScore.score ?? 75;
  const level = realityScore.level ?? realityScore.grade ?? "Moderate Alignment";
  const feedback = realityScore.feedback ?? realityScore.description ?? "Keep planning consistently.";
  const plannedHours = realityScore.plannedHours ?? 0;
  const actualHours = realityScore.actualHours ?? 0;
  const completionRate = realityScore.completionRate ?? 0;
  const rescheduledRate = realityScore.rescheduledRate ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--ink)]">
                Goal Reality Score
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Transparent evaluation of planning ambition vs actual execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Score Display Card */}
        <div className="mt-5 p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-[var(--surface-2)] to-blue-500/10 border border-purple-500/20 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles size={13} />
            <span>{level}</span>
          </div>

          <div className="flex items-baseline justify-center gap-1">
            <span className="font-display text-5xl sm:text-6xl font-black text-[var(--ink)] tracking-tight">
              {score}
            </span>
            <span className="text-xl font-medium text-[var(--ink-muted)]">/ 100</span>
          </div>

          <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto leading-relaxed">
            {feedback}
          </p>
        </div>

        {/* Real Metrics Breakdown */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
            <div className="text-[11px] text-[var(--ink-muted)]">Planned Time</div>
            <div className="text-base font-bold text-[var(--ink)] mt-1">{plannedHours}h</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
            <div className="text-[11px] text-[var(--ink-muted)]">Completed Time</div>
            <div className="text-base font-bold text-emerald-500 mt-1">{actualHours}h</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
            <div className="text-[11px] text-[var(--ink-muted)]">Completion Rate</div>
            <div className="text-base font-bold text-[var(--ink)] mt-1">{completionRate}%</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
            <div className="text-[11px] text-[var(--ink-muted)]">Rescheduled</div>
            <div className="text-base font-bold text-amber-500 mt-1">{rescheduledRate}%</div>
          </div>
        </div>

        {/* Score Formula Explanation */}
        <div className="mt-5 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs">
          <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <HelpCircle size={14} className="text-purple-500" />
            <span>How is this score computed?</span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
            Unlike simple checklists, your Goal Reality Score inspects your planned hours against completed execution. Planning 10 hours and completing 2 hours triggers an <strong>over-planning penalty</strong>. Consistently completing 85–100% of your chosen commitments without repeated rescheduling builds an <strong>Elite Reality Score</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="default" className="px-6 rounded-xl">
            Understood
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

