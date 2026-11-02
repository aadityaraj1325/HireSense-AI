import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, RefreshCw, AlertCircle, ArrowRight, CheckCircle2, Calendar, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GoalRecoveryModal({
  isOpen,
  onClose,
  recoveryData = {},
  onApplyAction,
  isApplying = false,
}) {
  if (!isOpen) return null;

  const totalUnfinished = recoveryData.totalUnfinished ?? 0;
  const suggestions = recoveryData.suggestions || [];
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <RefreshCw size={20} className={isApplying ? "animate-spin" : ""} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--ink)]">
                Goal Recovery Engine
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Intelligently reschedule unfinished goals without overloading your future days
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

        {/* Content Body */}
        <div className="mt-5 space-y-4 overflow-y-auto pr-1">
          {/* Recovery Summary Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-[var(--ink)]">
                {totalUnfinished} unfinished task{totalUnfinished === 1 ? "" : "s"} detected from recent days
              </span>
              <p className="text-[var(--ink-muted)] leading-relaxed">
                Life happens. Instead of letting missed items create guilt or an impossible 14-hour backlog, the Goal Recovery Engine re-plans tasks realistically within a healthy 6-hour daily focus cap.
              </p>
            </div>
          </div>

          {/* Target Reschedule Date Picker */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[var(--ink)]">Target Reschedule Date</div>
              <div className="text-[11px] text-[var(--ink-muted)]">Where should these missed tasks be placed?</div>
            </div>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          {/* Suggestions List */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-[var(--ink)]">Detected Backlog Tasks:</div>
            {suggestions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--ink-muted)] border border-dashed border-[var(--border)] rounded-2xl">
                No past unfinished tasks found. Your agenda is completely clear!
              </div>
            ) : (
              suggestions.map((s, idx) => (
                <div
                  key={s.taskId || idx}
                  className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--ink)]">{s.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {s.priority} priority
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--ink-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Original: {s.originalDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {s.expectedDuration || 60}m
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-500/90 font-medium pt-0.5">
                    💡 {s.explanation}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            onClick={() => onApplyAction({ action: "dismiss_all" })}
            disabled={isApplying || totalUnfinished === 0}
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl"
          >
            Clear / Dismiss All
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => onApplyAction({ action: "reschedule_smart", targetDate })}
              disabled={isApplying || totalUnfinished === 0}
              className="rounded-xl text-xs flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <span>Reschedule Safely</span>
              <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

