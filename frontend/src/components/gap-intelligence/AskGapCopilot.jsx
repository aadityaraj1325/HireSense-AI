import { useState, useRef, useEffect } from "react";
import {
  BrainCircuit,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PROMPT_CHIPS = [
  "Which gap should I tackle first this week?",
  "How can I prove Docker using my connected GitHub?",
  "Why is System Design marked as blocked for me?",
  "Generate a production resume bullet for my top gap.",
];

export default function AskGapCopilot({ onAsk, isAsking }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am your HireSense Gap Intelligence Copilot. I analyze your verified repositories, resume sections, and target job requirements to give grounded career guidance. How can I help you close your gaps today?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || isAsking) return;

    setInput("");
    const newMessages = [...messages, { role: "user", text: q }];
    setMessages(newMessages);

    try {
      const response = await onAsk(q);
      const reply =
        response?.reply ||
        response?.message ||
        "Based on your demonstrated evidence, focusing on building practical project artifacts will directly bridge your readiness score.";
      setMessages([...newMessages, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          text: "I encountered an error processing your query. Please verify your connection or try a simpler question.",
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[580px] rounded-2xl border border-[var(--border)] bg-[#0d1019] overflow-hidden shadow-2xl">
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--ink)] tracking-tight">
              Ask Gap Intelligence AI
            </h3>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Grounded in your resume, GitHub repos, and target job description
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-2)] text-emerald-400 border border-[var(--border)]">
          Online
        </span>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]/60 overflow-x-auto">
        <Sparkles size={13} className="text-[var(--accent)] shrink-0" />
        {PROMPT_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleSend(chip)}
            disabled={isAsking}
            className="shrink-0 px-2.5 py-1 text-[11px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-colors text-left"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 text-left",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs",
                  isUser
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--accent-strong)] border border-[var(--border)]"
                )}
              >
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div
                className={cn(
                  "p-3.5 rounded-2xl text-xs leading-relaxed max-w-[80%]",
                  isUser
                    ? "bg-[var(--accent)] text-white rounded-tr-sm"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] rounded-tl-sm shadow-sm"
                )}
              >
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            </div>
          );
        })}

        {isAsking && (
          <div className="flex items-start gap-3 text-left">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-[var(--surface-2)] text-[var(--accent-strong)] border border-[var(--border)]">
              <Bot size={14} />
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink-muted)] rounded-tl-sm flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin text-[var(--accent)]" />
              <span>Analyzing evidence and formulating grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your gaps, prerequisites, or projects..."
          className="flex-1 h-9 px-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)]"
          disabled={isAsking}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || isAsking}
          className="h-9 w-9 p-0 flex items-center justify-center shrink-0"
        >
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}

