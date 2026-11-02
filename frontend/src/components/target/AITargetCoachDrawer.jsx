import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Send,
  Target,
  Brain,
  Lightbulb,
  ArrowRight,
  Bot,
  User,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAskTargetCoach } from "@/hooks/useTarget";

const QUICK_PROMPTS = [
  "Plan tomorrow's schedule for me tonight",
  "How can I improve my Goal Reality Score?",
  "What is my highest-priority topic to study right now?",
  "I'm feeling overwhelmed with my exam syllabus",
];

export function AITargetCoachDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "coach",
      text: "Hello! I am your AI Target Coach. I have live access to your streak, pending tasks, spaced repetition syllabus, and Goal Reality Score. How can I help you plan or execute today?",
      insights: [
        "Plan tomorrow tonight to eliminate morning friction",
        "Keep daily study hours consistent",
      ],
      suggestedActions: [
        "Review your pending tasks",
        "Clear due spaced revisions",
      ],
      focusRecommendation: "Pick your highest-priority goal for a 45-minute deep work sprint.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  const askCoachMutation = useAskTargetCoach();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend = inputText) => {
    if (!textToSend.trim() || askCoachMutation.isPending) return;

    const userMsg = textToSend.trim();
    setInputText("");

    const newHistory = [...messages, { role: "user", text: userMsg }];
    setMessages(newHistory);

    try {
      const result = await askCoachMutation.mutateAsync({
        message: userMsg,
        conversationHistory: newHistory.map((m) => ({
          role: m.role === "coach" ? "assistant" : "user",
          text: m.text,
        })),
      });

      if (result?.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "coach",
            text: result.data.reply,
            insights: result.data.insights || [],
            suggestedActions: result.data.suggestedActions || [],
            focusRecommendation: result.data.focusRecommendation,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text: "I had trouble connecting to the AI Coach engine. Try focusing on your scheduled tasks and spaced repetitions for now!",
        },
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-screen max-w-md bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col h-full"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-md">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                  AI Target Coach
                </h3>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Grounded in your live schedule & reality score
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompt Pills */}
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-2)] overflow-x-auto whitespace-nowrap flex gap-1.5 no-scrollbar shrink-0">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={askCoachMutation.isPending}
                className="px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-purple-500/50 text-[11px] font-medium text-[var(--ink-muted)] hover:text-purple-500 transition-all shrink-0 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => {
              const isCoach = m.role === "coach";
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isCoach ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isCoach
                        ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                        : "bg-[var(--accent)] text-white"
                    }`}
                  >
                    {isCoach ? <Bot size={15} /> : <User size={15} />}
                  </div>

                  <div className={`space-y-2 max-w-[82%]`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isCoach
                          ? "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] shadow-sm"
                          : "bg-purple-600 text-white rounded-tr-none shadow-md"
                      }`}
                    >
                      {m.text}
                    </div>

                    {/* Coach Structured Suggestions */}
                    {isCoach && m.focusRecommendation && (
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-purple-400 font-bold text-[11px]">
                          <Zap size={12} />
                          <span>Immediate Focus Recommendation:</span>
                        </div>
                        <p className="text-[11px] text-[var(--ink)] font-medium">
                          {m.focusRecommendation}
                        </p>
                      </div>
                    )}

                    {isCoach && m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1">
                        <div className="text-[10px] uppercase font-bold text-[var(--ink-muted)]">
                          Suggested Steps:
                        </div>
                        {m.suggestedActions.map((act, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--ink)]">
                            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {askCoachMutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)] pl-2">
                <Sparkles size={14} className="animate-spin text-purple-500" />
                <span>Coach is analyzing your metrics...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask coach about tasks, exams, routine..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={askCoachMutation.isPending}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || askCoachMutation.isPending}
                className="h-8 w-8 p-0 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shrink-0"
              >
                <Send size={14} />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

