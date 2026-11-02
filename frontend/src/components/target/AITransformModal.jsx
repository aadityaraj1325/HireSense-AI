import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  X,
  Copy,
  Plus,
  ArrowRight,
  Replace,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export const TRANSFORM_OPTIONS = [
  { id: "summary", label: "Executive Summary", icon: "📝", desc: "Concise high-impact summary" },
  { id: "detailed_notes", label: "Detailed Study Notes", icon: "📚", desc: "Structured textbook-style notes with headings" },
  { id: "interview_prep", label: "Interview Preparation Q&A", icon: "🎯", desc: "Top technical questions & architectural trade-offs" },
  { id: "exam_notes", label: "Exam-Oriented Notes", icon: "🏆", desc: "High-yield definitions, scoring points & formulas" },
  { id: "hinglish", label: "Hinglish Explanation", icon: "🇮🇳", desc: "Conversational bilingual tech breakdown" },
  { id: "flashcards", label: "Generate Flashcards", icon: "🗂️", desc: "Active recall question & answer cards" },
  { id: "mcqs", label: "Generate 4 MCQs with Solutions", icon: "❓", desc: "Practice questions testing conceptual clarity" },
  { id: "mind_map", label: "Mind Map Outline", icon: "🧠", desc: "Hierarchical conceptual tree" },
  { id: "cheat_sheet", label: "Quick-Lookup Cheat Sheet", icon: "📋", desc: "Compact syntax, rules, and shortcut table" },
  { id: "tutorial", label: "Step-by-Step Tutorial", icon: "🛠️", desc: "Implementation walkthrough with milestones" },
  { id: "code_examples", label: "Practical Code Examples", icon: "💻", desc: "Idiomatic code with comments & tests" },
];

export function AITransformModal({
  isOpen,
  onClose,
  currentTitle,
  initialText,
  isTransforming,
  transformResult,
  onRunTransform,
  onInsertAtCursor,
  onReplaceSelected,
  onSaveAsNewNote,
}) {
  const [selectedType, setSelectedType] = useState("summary");
  const [copied, setCopied] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!transformResult?.transformedContent) return;
    navigator.clipboard.writeText(transformResult.transformedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col justify-between overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                Transform with AI Studio
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Reshape your study material safely without overwriting your original notes.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)]">
            <X size={16} />
          </button>
        </div>

        {/* Transformation Type Selector */}
        <div className="space-y-2 shrink-0">
          <label className="text-[11px] uppercase font-bold text-[var(--ink-muted)] block">
            Select Transformation Target
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {TRANSFORM_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedType(opt.id);
                  onRunTransform(opt.id);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedType === opt.id
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold shadow-sm"
                    : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Preview & Output */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[260px] p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
          {isTransforming ? (
            <div className="p-12 text-center space-y-3">
              <Sparkles size={32} className="mx-auto text-amber-500 animate-spin" />
              <div className="text-sm font-bold text-[var(--ink)]">Generating AI Transformation...</div>
              <p className="text-xs text-[var(--ink-muted)]">
                Processing structure, extracting key takeaways, and crafting formatted content.
              </p>
            </div>
          ) : transformResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold border-b border-[var(--border)] pb-2">
                <span>{transformResult.summary}</span>
                <span className="text-[11px] text-[var(--ink-muted)]">Safe Preview Mode</span>
              </div>

              {transformResult.keyTakeaways?.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Key Takeaways</div>
                  <ul className="space-y-1 text-xs">
                    {transformResult.keyTakeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[var(--ink)]">
                        <span className="text-amber-500">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] leading-relaxed whitespace-pre-wrap font-sans">
                {transformResult.transformedContent}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-[var(--ink-muted)] space-y-2">
              <FileText size={28} className="mx-auto opacity-50" />
              <div>Select a transformation above and click "Run Transformation"</div>
              <Button
                onClick={() => onRunTransform(selectedType)}
                className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                Run {TRANSFORM_OPTIONS.find((t) => t.id === selectedType)?.label}
              </Button>
            </div>
          )}
        </div>

        {/* Safety Warning */}
        {confirmReplace && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>Are you sure you want to replace the selected text with this transformation?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmReplace(false)}
                className="text-xs px-2 py-1 rounded bg-[var(--surface)] text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmReplace(false);
                  onReplaceSelected(transformResult.transformedContent);
                }}
                className="text-xs px-2 py-1 rounded bg-rose-600 text-white font-bold"
              >
                Confirm Replace
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!transformResult}
            className="rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Copy size={13} />
            <span>{copied ? "Copied!" : "Copy Output"}</span>
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => onSaveAsNewNote(transformResult.transformedContent, selectedType)}
              disabled={!transformResult}
              className="rounded-xl text-xs flex items-center gap-1.5 text-blue-400 border-blue-500/30 cursor-pointer"
            >
              <Plus size={13} />
              <span>Save as New Doc</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setConfirmReplace(true)}
              disabled={!transformResult}
              className="rounded-xl text-xs flex items-center gap-1.5 text-rose-400 border-rose-500/30 cursor-pointer"
            >
              <Replace size={13} />
              <span>Replace Selection</span>
            </Button>

            <Button
              onClick={() => onInsertAtCursor(transformResult.transformedContent)}
              disabled={!transformResult}
              className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight size={13} />
              <span>Insert at Cursor</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

