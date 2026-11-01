import { useState } from "react";
import { AlertTriangle, ArrowDownRight, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GapRegressionAlert({ regressionNotice, onSelectRole }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !regressionNotice) return null;

  return (
    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-lg text-left flex items-start justify-between gap-3 animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle size={18} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-amber-300">
              {regressionNotice.headline || "Role Expectation Shift Detected"}
            </h4>
            {regressionNotice.scoreDelta && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                {regressionNotice.scoreDelta}% coverage shift
              </span>
            )}
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl">
            {regressionNotice.details ||
              "Changing target role or introducing new job description criteria introduces critical newly required competencies."}
          </p>

          {regressionNotice.newGaps && regressionNotice.newGaps.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-amber-300/80">New Gaps:</span>
              {regressionNotice.newGaps.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/20 border border-amber-500/30 text-amber-200"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

