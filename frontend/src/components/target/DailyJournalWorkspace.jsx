import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Save,
  BookOpen,
  Smile,
  Meh,
  Frown,
  Zap,
  BatteryCharging,
  ArrowRight,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTargetDailyJournal, useSaveTargetDailyJournal } from "@/hooks/useTarget";

const MOODS = [
  { id: "exhausted", label: "Exhausted", icon: "🥱" },
  { id: "low", label: "Low Focus", icon: "😔" },
  { id: "neutral", label: "Neutral", icon: "😐" },
  { id: "good", label: "Good Flow", icon: "😊" },
  { id: "energized", label: "Energized", icon: "🔥" },
];

export function DailyJournalWorkspace() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [reflection, setReflection] = useState({
    whatWentWell: "",
    whatDistracted: "",
    tomorrowPriority: "",
    notes: "",
  });
  const [mood, setMood] = useState("good");
  const [productivityRating, setProductivityRating] = useState(8);

  const { data: journal = {}, isLoading } = useTargetDailyJournal(selectedDate);
  const saveJournalMutation = useSaveTargetDailyJournal();

  useEffect(() => {
    if (journal) {
      setReflection({
        whatWentWell: journal.reflection?.whatWentWell || "",
        whatDistracted: journal.reflection?.whatDistracted || "",
        tomorrowPriority: journal.reflection?.tomorrowPriority || "",
        notes: journal.reflection?.notes || "",
      });
      if (journal.mood) setMood(journal.mood);
      if (journal.productivityRating) setProductivityRating(journal.productivityRating);
    }
  }, [journal]);

  const handleSave = async (e) => {
    e.preventDefault();
    await saveJournalMutation.mutateAsync({
      date: selectedDate,
      reflection,
      mood,
      productivityRating,
    });
  };

  const tasksSummary = journal.tasksSummary || [];
  const totalStudyMinutes = journal.totalStudyMinutes || 0;
  const studyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Clock size={13} />
            <span>Evening Day Inspection & Structured Reflection</span>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--ink)]">
            What Did I Do Today?
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Review your auto-aggregated deliverables, log honest feedback, and lock in tomorrow's #1 commitment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
          />
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Auto-Aggregated Day Summary (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-display font-bold text-sm text-[var(--ink)]">
              Auto-Aggregated Activity ({selectedDate})
            </h3>
            <span className="text-xs font-bold text-rose-500">{studyHours}h logged</span>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--ink-muted)]">Completed Deliverables:</div>
            {tasksSummary.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] text-xs text-[var(--ink-muted)] text-center">
                No completed tasks recorded for this date.
              </div>
            ) : (
              tasksSummary.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
                >
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span className="font-medium text-[var(--ink)] truncate">{t.title}</span>
                  <span className="text-[10px] text-[var(--ink-muted)] ml-auto shrink-0">
                    {t.expectedDuration || 60}m
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Structured Reflection Form (8 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-display font-bold text-sm text-[var(--ink)]">
              Evening Structured Reflection
            </h3>
            <Button
              type="submit"
              disabled={saveJournalMutation.isPending}
              className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5"
            >
              <Save size={13} />
              <span>Save Journal Entry</span>
            </Button>
          </div>

          {/* Mood & Productivity Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--ink)] block">
                How Was Your Energy & Mood Today?
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      mood === m.id
                        ? "bg-rose-500/15 border-rose-500 text-rose-500 font-bold"
                        : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)]"
                    }`}
                  >
                    <div className="text-lg">{m.icon}</div>
                    <div className="text-[9px] mt-0.5 truncate">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--ink)] block">
                Self-Evaluated Productivity (1 to 10): <span className="text-rose-500 font-bold">{productivityRating}/10</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={productivityRating}
                onChange={(e) => setProductivityRating(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--ink-muted)]">
                <span>1 - Distracted</span>
                <span>5 - Moderate</span>
                <span>10 - Unstoppable Flow</span>
              </div>
            </div>
          </div>

          {/* Reflection Questions */}
          <div className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                1. What went well today? (Wins, breakthroughs, completed topics)
              </label>
              <textarea
                rows={2}
                placeholder="Solved 4 dynamic programming questions, hit morning workout, focused for 4 hours..."
                value={reflection.whatWentWell}
                onChange={(e) => setReflection({ ...reflection, whatWentWell: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                2. What distracted me or didn't get finished? (Root causes, hurdles)
              </label>
              <textarea
                rows={2}
                placeholder="Spent 45 minutes on social media after lunch, struggled with graphs problem..."
                value={reflection.whatDistracted}
                onChange={(e) => setReflection({ ...reflection, whatDistracted: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                3. What is my #1 single priority for tomorrow? (Plan tonight to win tomorrow)
              </label>
              <input
                type="text"
                placeholder="e.g. Master Tree Traversals from 9:00 AM to 11:30 AM without opening email"
                value={reflection.tomorrowPriority}
                onChange={(e) => setReflection({ ...reflection, tomorrowPriority: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

