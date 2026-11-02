import React, { useRef, useEffect } from "react";
import { ArrowUp, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  {
    category: "Resume & ATS",
    prompt: "How can I improve my resume's ATS score and integrate missing keywords?",
  },
  {
    category: "Technical & DSA",
    prompt: "Explain how to implement an LRU Cache with step-by-step logic, code, and trade-offs.",
  },
  {
    category: "System Design",
    prompt: "How should I design a real-time notification service handling 100k requests/sec?",
  },
  {
    category: "Interview Prep",
    prompt: "What are the most common technical questions asked for my target role, and how should I structure answers?",
  },
];

export function ChatInputBar({
  input,
  setInput,
  onSend,
  isGenerating,
  onStop,
  showStarters,
  onSelectStarter,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isGenerating) {
        onSend();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-3 pt-2">
      {/* Starter Prompts when conversation is empty */}
      {showStarters && (
        <div className="space-y-3 pb-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-[var(--ink-muted)]">
            <Sparkles size={13} className="text-amber-500" />
            <span>Suggested Starter Prompts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {STARTER_PROMPTS.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectStarter(sp.prompt)}
                className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-all cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-[var(--accent-strong)] uppercase tracking-wider mb-1">
                  {sp.category}
                </div>
                <div className="text-xs text-[var(--ink)] line-clamp-2 leading-relaxed">
                  {sp.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative flex items-end gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-card focus-within:border-[var(--accent)] transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your resume, coding topics, interviews, or career path..."
          disabled={isGenerating}
          className="flex-1 max-h-40 resize-none bg-transparent px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none leading-relaxed"
        />

        {isGenerating ? (
          <button
            type="button"
            onClick={onStop}
            title="Stop generation"
            className="h-10 w-10 rounded-2xl bg-[var(--ink)] text-[var(--bg)] flex items-center justify-center shrink-0 hover:opacity-90 transition-all cursor-pointer"
          >
            <Square size={14} className="fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim()}
            title="Send message (Enter)"
            className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
              input.trim()
                ? "bg-[var(--ink)] text-[var(--bg)] shadow-sm hover:opacity-90 active:scale-95 cursor-pointer"
                : "bg-[var(--surface-2)] text-[var(--ink-muted)] cursor-not-allowed opacity-50"
            )}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="text-center text-[11px] text-[var(--ink-muted)] pb-1">
        Ask HireSense AI provides personalized technical and career guidance grounded in your active profile.
      </div>
    </div>
  );
}

