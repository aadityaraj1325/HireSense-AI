import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Layers,
  GraduationCap,
  ArrowRight,
  Code2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AIExplainDrawer({
  isOpen,
  onClose,
  selectedText,
  contextTitle,
  explanation,
  isLoading,
  onLevelChange,
  currentLevel = "intermediate",
  onInsertIntoDoc,
  onSaveAsFlashcard,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!explanation) return;
    const text = `
Definition: ${explanation.definition}
Explanation: ${explanation.detailedExplanation}
Analogy: ${explanation.analogy}
Exam/Interview: ${explanation.interviewOrExamRelevance}
Revision: ${explanation.revisionSummary}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-xl h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                AI Deep Explanation
              </h3>
              <p className="text-[10px] text-[var(--ink-muted)]">
                10-dimension conceptual breakdown & interview mastery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-muted)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected snippet & Depth Selector */}
        <div className="p-4 bg-[var(--surface-2)]/50 border-b border-[var(--border)] space-y-2.5 shrink-0">
          <div className="text-xs text-[var(--ink-muted)] flex items-center justify-between">
            <span className="font-semibold text-purple-400">Context: {contextTitle || "Study Notes"}</span>
            <div className="flex items-center gap-1">
              {["beginner", "intermediate", "advanced", "interview", "exam"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onLevelChange(lvl)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold transition-all cursor-pointer ${
                    currentLevel === lvl
                      ? "bg-purple-600 text-white"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] font-mono line-clamp-3">
            "{selectedText}"
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <Sparkles size={28} className="mx-auto text-purple-400 animate-spin" />
              <div className="text-sm font-bold text-[var(--ink)]">Synthesizing 10-Dimension Explanation...</div>
              <p className="text-xs text-[var(--ink-muted)]">
                Analyzing core definition, runtime mechanics, real-world examples, and interview relevance.
              </p>
            </div>
          ) : !explanation ? (
            <div className="p-8 text-center text-[var(--ink-muted)]">
              No explanation generated yet. Select a word or concept in your notes and click AI Explain.
            </div>
          ) : (
            <div className="space-y-4 text-[var(--ink)]">
              {/* 1. Core Definition */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen size={12} />
                  <span>1. Core Definition</span>
                </div>
                <div className="text-xs font-semibold leading-relaxed">
                  {explanation.definition}
                </div>
              </div>

              {/* 2. Detailed Explanation */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider">
                  2. In-Depth Breakdown
                </div>
                <p className="text-xs leading-relaxed text-[var(--ink)]/90">
                  {explanation.detailedExplanation}
                </p>
              </div>

              {/* 3. Step-by-Step Understanding */}
              {explanation.stepByStep?.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider">
                    3. Step-by-Step Mechanism
                  </div>
                  <ul className="space-y-1">
                    {explanation.stepByStep.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <span className="font-bold text-purple-400 shrink-0">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Analogy */}
              {explanation.analogy && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb size={12} />
                    <span>6. Intuitive Analogy</span>
                  </div>
                  <p className="text-xs leading-relaxed italic">{explanation.analogy}</p>
                </div>
              )}

              {/* 5. Real World & Technical Examples */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {explanation.realWorldExample && (
                  <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      4. Real-World Use
                    </div>
                    <p className="text-[11px] leading-relaxed">{explanation.realWorldExample}</p>
                  </div>
                )}
                {explanation.technicalExample && (
                  <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <Code2 size={12} />
                      <span>5. Technical Example</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{explanation.technicalExample}</p>
                  </div>
                )}
              </div>

              {/* 7. Common Mistakes */}
              {explanation.commonMistakes?.length > 0 && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                  <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>7. Common Pitfalls & Mistakes</span>
                  </div>
                  <ul className="space-y-1 text-xs">
                    {explanation.commonMistakes.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 8. Interview / Exam Relevance */}
              {explanation.interviewOrExamRelevance && (
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap size={12} />
                    <span>9. Interview & Exam Relevance</span>
                  </div>
                  <p className="text-xs leading-relaxed">{explanation.interviewOrExamRelevance}</p>
                </div>
              )}

              {/* 9. Revision Summary */}
              {explanation.revisionSummary && (
                <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
                  <div className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-wider">
                    10. Fast Revision Takeaway
                  </div>
                  <p className="text-xs leading-relaxed font-semibold">{explanation.revisionSummary}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Copy size={13} />
            <span>{copied ? "Copied!" : "Copy Summary"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onSaveAsFlashcard(explanation)}
              className="rounded-xl text-xs flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 cursor-pointer"
            >
              <Layers size={13} />
              <span>Make Flashcard</span>
            </Button>

            <Button
              onClick={() => onInsertIntoDoc(explanation)}
              className="rounded-xl text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight size={13} />
              <span>Insert in Note</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

