import React, { useState } from "react";
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Trash2,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export const DOUBT_CATEGORIES = [
  "I don't understand",
  "Need an example",
  "Need revision",
  "Important for exam",
  "Interview doubt",
  "Verify this information",
];

const STATUS_MAP = {
  unresolved: { label: "Unresolved", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  ai_explained: { label: "AI Explained", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  user_understood: { label: "Understood", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  needs_further_revision: { label: "Needs Revision", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  resolved: { label: "Resolved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

export function DoubtTrackerView({
  doubts = [],
  currentDocTitle = "",
  onUpdateDoubtStatus,
  onAskAIExplainDoubt,
  onCreateRevisionTask,
  onDeleteDoubt,
}) {
  const [taskSuccessMsg, setTaskSuccessMsg] = useState("");

  const handleCreateTask = async (doubt) => {
    try {
      await onCreateRevisionTask({
        text: doubt.text,
        title: doubt.title || doubt.text.slice(0, 35),
        docTitle: currentDocTitle,
      });
      setTaskSuccessMsg(`Revision task created for "${doubt.text.slice(0, 30)}..."`);
      setTimeout(() => setTaskSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Failed to create revision task:", err);
    }
  };

  const unresolvedList = doubts.filter((d) => d.status !== "resolved");
  const resolvedList = doubts.filter((d) => d.status === "resolved");

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
        <div>
          <div className="font-bold text-sm text-[var(--ink)] flex items-center gap-1.5">
            <HelpCircle size={15} className="text-amber-500" />
            <span>Intelligent Doubt Detector & Tracker</span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">
            {unresolvedList.length} unresolved doubts ({resolvedList.length} resolved)
          </p>
        </div>
      </div>

      {taskSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={14} />
          <span>{taskSuccessMsg}</span>
        </div>
      )}

      {doubts.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] space-y-2">
          <HelpCircle size={32} className="mx-auto text-[var(--ink-muted)] opacity-40" />
          <div className="font-bold text-sm text-[var(--ink)]">No Doubts Marked in this Document</div>
          <p className="text-[11px] text-[var(--ink-muted)] max-w-sm mx-auto">
            Select unclear text or tricky code in your notes and click "Mark Doubt" to track it here and generate revision tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map((doubt) => {
            const st = STATUS_MAP[doubt.status] || STATUS_MAP.unresolved;

            return (
              <div
                key={doubt.id}
                className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3 transition-all hover:border-[var(--ink-muted)]/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                      {doubt.category || "Need an example"}
                    </span>
                    <div className="text-xs font-bold text-[var(--ink)] mt-0.5">
                      "{doubt.text}"
                    </div>
                  </div>

                  <select
                    value={doubt.status || "unresolved"}
                    onChange={(e) => onUpdateDoubtStatus(doubt.id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none ${st.color}`}
                  >
                    {Object.entries(STATUS_MAP).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {doubt.aiExplanation && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-[var(--ink)] space-y-1">
                    <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                      <Sparkles size={11} />
                      <span>AI Resolution Note</span>
                    </div>
                    <p className="line-clamp-3 leading-relaxed">{doubt.aiExplanation}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60 text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAskAIExplainDoubt(doubt)}
                      className="text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>Ask AI</span>
                    </button>

                    <button
                      onClick={() => handleCreateTask(doubt)}
                      className="text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Calendar size={12} />
                      <span>Create Revision Task</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteDoubt(doubt.id)}
                    className="text-[var(--ink-muted)] hover:text-red-500 p-1"
                    title="Delete Doubt"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

