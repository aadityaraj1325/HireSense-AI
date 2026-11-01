import { useEffect, useRef } from "react";
import { Bot, User, Clock, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ConversationTranscriptDrawer({
  isOpen,
  onClose,
  history = [],
  activeTopic = "",
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col h-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)]">Live Interview Transcript</h3>
              <p className="text-xs text-[var(--ink-muted)]">Real-time voice speech-to-text dialogue</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-10 text-xs text-[var(--ink-muted)]">
                The conversation transcript will appear here as you speak.
              </div>
            ) : (
              history.map((msg, index) => {
                const isAI = msg.role === "interviewer";
                return (
                  <div
                    key={msg.id || index}
                    className={`flex gap-3 text-xs sm:text-sm ${isAI ? "items-start" : "items-start flex-row-reverse"}`}
                  >
                    {/* Role Icon */}
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
                        isAI
                          ? "bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent-strong)]"
                          : "bg-blue-500/10 border-blue-500/30 text-blue-500"
                      }`}
                    >
                      {isAI ? <Bot size={15} /> : <User size={15} />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-sm ${
                        isAI
                          ? "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)]"
                          : "bg-[var(--accent)] text-white border border-[var(--accent-strong)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[10px] opacity-75">
                        <span className="font-semibold">{isAI ? "AI Interviewer" : "Candidate"}</span>
                        {msg.topic && isAI && (
                          <span className="px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 uppercase font-mono">
                            {msg.topic}
                          </span>
                        )}
                        {msg.isInterruption && (
                          <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                            <AlertTriangle size={10} /> Interruption
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

