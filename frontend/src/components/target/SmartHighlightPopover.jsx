import React, { useState } from "react";
import {
  Highlighter,
  MessageSquare,
  Sparkles,
  Layers,
  HelpCircle,
  Trash2,
  X,
  Check,
  Calendar,
} from "lucide-react";

export const HIGHLIGHT_COLORS = [
  { id: "yellow", label: "Yellow", bg: "bg-yellow-400/30", text: "text-yellow-300", border: "border-yellow-400/50", hex: "#facc15" },
  { id: "green", label: "Green", bg: "bg-emerald-400/30", text: "text-emerald-300", border: "border-emerald-400/50", hex: "#4ade80" },
  { id: "blue", label: "Blue", bg: "bg-blue-400/30", text: "text-blue-300", border: "border-blue-400/50", hex: "#60a5fa" },
  { id: "pink", label: "Pink", bg: "bg-pink-400/30", text: "text-pink-300", border: "border-pink-400/50", hex: "#f472b6" },
  { id: "purple", label: "Purple", bg: "bg-purple-400/30", text: "text-purple-300", border: "border-purple-400/50", hex: "#c084fc" },
  { id: "orange", label: "Orange", bg: "bg-orange-400/30", text: "text-orange-300", border: "border-orange-400/50", hex: "#fb923c" },
  { id: "red", label: "Red", bg: "bg-rose-400/30", text: "text-rose-300", border: "border-rose-400/50", hex: "#fb7185" },
];

export const HIGHLIGHT_CATEGORIES = [
  "Important",
  "Definition",
  "Exam Question",
  "Remember",
  "Formula",
  "Example",
  "Doubt",
  "Revision",
  "Critical Concept",
];

export function SmartHighlightPopover({
  selectedText,
  existingHighlight = null,
  onApplyHighlight,
  onAskAI,
  onConvertToFlashcard,
  onMarkAsDoubt,
  onRemoveHighlight,
  onClose,
}) {
  const [color, setColor] = useState(existingHighlight?.color || "yellow");
  const [category, setCategory] = useState(existingHighlight?.category || "Important");
  const [comment, setComment] = useState(existingHighlight?.comment || "");
  const [showCommentBox, setShowCommentBox] = useState(!!existingHighlight?.comment);

  const handleSave = () => {
    onApplyHighlight({
      id: existingHighlight?.id || `hl_${Date.now()}`,
      text: selectedText || existingHighlight?.text || "",
      color,
      category,
      comment: comment.trim(),
    });
  };

  return (
    <div className="w-80 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-3.5 space-y-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
          <Highlighter size={14} className="text-amber-500" />
          <span>Smart Highlight</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--surface-2)] text-[var(--ink-muted)]">
          <X size={14} />
        </button>
      </div>

      {/* Selected text preview */}
      <div className="p-2 rounded-xl bg-[var(--surface-2)] text-[11px] text-[var(--ink)] line-clamp-2 italic border border-[var(--border)]">
        "{selectedText || existingHighlight?.text}"
      </div>

      {/* 1. Color Palette */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[var(--ink-muted)] block mb-1.5">
          Highlight Color
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColor(c.id)}
              className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                color === c.id ? "ring-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
              }`}
              style={{ backgroundColor: c.hex, borderColor: "rgba(0,0,0,0.2)" }}
              title={c.label}
            >
              {color === c.id && <Check size={12} className="text-black font-black" />}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Category Selector */}
      <div>
        <label className="text-[10px] uppercase font-bold text-[var(--ink-muted)] block mb-1.5">
          Category Tag
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none"
        >
          {HIGHLIGHT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Optional Comment Box */}
      {showCommentBox ? (
        <div>
          <label className="text-[10px] uppercase font-bold text-[var(--ink-muted)] block mb-1">
            Note / Explanation
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add personal explanation or revision tip..."
            className="w-full p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCommentBox(true)}
          className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-semibold"
        >
          <MessageSquare size={12} />
          <span>+ Add Comment or Explanation</span>
        </button>
      )}

      {/* 4. Action Buttons */}
      <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onAskAI}
            className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 font-semibold border border-purple-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[11px]"
          >
            <Sparkles size={12} />
            <span>AI Explain</span>
          </button>

          <button
            type="button"
            onClick={onConvertToFlashcard}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[11px]"
          >
            <Layers size={12} />
            <span>Flashcard</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onMarkAsDoubt}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-semibold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[11px]"
          >
            <HelpCircle size={12} />
            <span>Mark Doubt</span>
          </button>

          {existingHighlight ? (
            <button
              type="button"
              onClick={onRemoveHighlight}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold border border-red-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[11px]"
            >
              <Trash2 size={12} />
              <span>Remove</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px]"
            >
              <Check size={13} />
              <span>Highlight</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

