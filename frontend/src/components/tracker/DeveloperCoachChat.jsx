import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Bot, Send, Sparkles, Lightbulb, ArrowRight, User } from "lucide-react";
import { developerTrackerApi } from "@/api/developerTracker";

const QUICK_PROMPTS = [
  "Analyze my GitHub activity and repos",
  "How consistent was my coding this month?",
  "Which skills have the strongest project evidence?",
  "Am I practicing enough for my target role?",
  "Which projects should I build next?",
  "What should I focus on tomorrow?",
];

export function DeveloperCoachChat() {
  const [messages, setMessages] = useState([
    {
      sender: "coach",
      text: "Hello! I am your HireSense AI Developer Coach. I analyze your real commits, solved problems, contest ratings, and target career requirements to give actionable engineering feedback.",
      insights: [
        "Answers are grounded strictly in your connected platforms and focus sessions",
        "If a platform is missing, I will clearly state that limitation",
      ],
      recommendation: "Select a prompt below or ask any question about your developer profile.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await developerTrackerApi.askCoach(q);
      const coachResp = res.coachResponse;
      setMessages((prev) => [
        ...prev,
        {
          sender: "coach",
          text: coachResp.answer,
          insights: coachResp.keyInsights,
          recommendation: coachResp.recommendedNextAction,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "coach",
          text: "I encountered an error retrieving live coaching recommendations. Please ensure your backend is reachable and try again.",
          insights: ["Network or server error encountered"],
          recommendation: "Check platform connection status.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[var(--border)] overflow-hidden flex flex-col h-[640px]">
      <CardHeader className="border-b border-[var(--border)] pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="text-[var(--accent)]" size={20} />
            <CardTitle>Ask Developer Coach AI</CardTitle>
          </div>
          <Badge tone="accent" className="gap-1">
            <Sparkles size={11} /> Grounded AI
          </Badge>
        </div>
        <CardDescription>
          Contextual career advice powered by your actual platforms, commit frequency, and skill evidence.
        </CardDescription>
      </CardHeader>

      {/* Message Stream */}
      <CardContent className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "coach" && (
              <div className="h-8 w-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
                <Bot size={16} />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-3 leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "bg-[var(--surface-2)]/90 border border-[var(--border)] text-[var(--ink)]"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Coach structured insights */}
              {msg.insights && msg.insights.length > 0 && (
                <div className="pt-2 border-t border-[var(--border)]/50 space-y-1">
                  <span className="font-semibold text-[11px] text-[var(--ink)] flex items-center gap-1">
                    <Lightbulb size={12} className="text-amber-400" /> Key Observations:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--ink-muted)]">
                    {msg.insights.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation */}
              {msg.recommendation && (
                <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[11px]">
                  <strong className="text-emerald-400 block mb-0.5">Next Recommended Action:</strong>
                  <span className="text-[var(--ink)]">{msg.recommendation}</span>
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="h-8 w-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0 font-semibold text-xs">
                <User size={15} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-[var(--ink-muted)]">
            <div className="h-8 w-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0 animate-pulse">
              <Bot size={16} />
            </div>
            <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] animate-pulse">
              Analyzing developer activities and formulating recommendations...
            </div>
          </div>
        )}
      </CardContent>

      {/* Quick Prompts & Input Bar */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)]/40 shrink-0 space-y-3">
        {/* Quick prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={loading}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Ask about your consistency, GitHub projects, DSA weaknesses..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !input.trim()}
            className="gap-1 px-4 shrink-0"
          >
            <Send size={14} />
          </Button>
        </form>
      </div>
    </Card>
  );
}

