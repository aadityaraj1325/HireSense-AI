import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  BookOpen,
  Calendar,
  X,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTargetRevisions, useCompleteTargetRevision } from "@/hooks/useTarget";

const CONFIDENCE_RATINGS = [
  {
    id: "forgot",
    label: "Forgot",
    sub: "Reset to Day 1",
    icon: "🧠",
    color: "hover:border-red-500 hover:bg-red-500/10",
  },
  {
    id: "difficult",
    label: "Difficult",
    sub: "Review in 2 Days",
    icon: "⚠️",
    color: "hover:border-amber-500 hover:bg-amber-500/10",
  },
  {
    id: "moderate",
    label: "Moderate",
    sub: "Review in 4 Days",
    icon: "👍",
    color: "hover:border-blue-500 hover:bg-blue-500/10",
  },
  {
    id: "easy",
    label: "Easy",
    sub: "Review in 7 Days",
    icon: "⚡",
    color: "hover:border-emerald-500 hover:bg-emerald-500/10",
  },
  {
    id: "mastered",
    label: "Mastered",
    sub: "Long-term (14-30d)",
    icon: "🏆",
    color: "hover:border-purple-500 hover:bg-purple-500/10",
  },
];

export function RevisionCenterWorkspace() {
  const [activeTab, setActiveTab] = useState("due"); // "due" | "overdue" | "today" | "upcoming" | "all"
  const [revisionModalTopic, setRevisionModalTopic] = useState(null);
  const [selectedRating, setSelectedRating] = useState("moderate");
  const [notes, setNotes] = useState("");

  const { data: revisionsData, isLoading } = useTargetRevisions();
  const completeRevisionMutation = useCompleteTargetRevision();

  const overdueList = Array.isArray(revisionsData?.overdue) ? revisionsData.overdue : [];
  const todayList = Array.isArray(revisionsData?.today) ? revisionsData.today : [];
  const upcomingList = Array.isArray(revisionsData?.upcoming) ? revisionsData.upcoming : [];
  const allList = Array.isArray(revisionsData)
    ? revisionsData
    : (revisionsData?.all || [...overdueList, ...todayList, ...upcomingList]);

  const dueList = [...overdueList, ...todayList];

  const displayedList =
    activeTab === "due"
      ? dueList
      : activeTab === "overdue"
      ? overdueList
      : activeTab === "today"
      ? todayList
      : activeTab === "upcoming"
      ? upcomingList
      : allList;

  const handleComplete = async () => {
    if (!revisionModalTopic) return;
    await completeRevisionMutation.mutateAsync({
      id: revisionModalTopic._id,
      data: {
        confidenceRating: selectedRating,
        notes,
      },
    });
    setRevisionModalTopic(null);
    setNotes("");
  };

  return (
    <div className="space-y-6">
      {/* 1. Revision Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Layers size={13} />
            <span>Spaced Repetition & Retention Engine</span>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--ink)]">
            Smart Revision Center
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Prevent the forgetting curve. Review learned topics at mathematically optimal intervals (1, 3, 7, 14, 30 days).
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center min-w-[120px]">
          <div className="text-[11px] text-[var(--ink-muted)]">Due for Review</div>
          <div className="text-lg font-black font-display text-indigo-500 mt-0.5">
            {dueList.length} topics
          </div>
        </div>
      </div>

      {/* 2. Sub-tab Filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab("due")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "due"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)]"
          }`}
        >
          Due Now ({dueList.length})
        </button>
        <button
          onClick={() => setActiveTab("overdue")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "overdue"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)]"
          }`}
        >
          Overdue ({overdueList.length})
        </button>
        <button
          onClick={() => setActiveTab("today")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "today"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)]"
          }`}
        >
          Today ({todayList.length})
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)]"
          }`}
        >
          Upcoming ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-zinc-700 text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)]"
          }`}
        >
          All Topics ({allList.length})
        </button>
      </div>

      {/* 3. Revisions List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--ink-muted)]">
            Scanning spaced repetition schedule...
          </div>
        ) : displayedList.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--border)] space-y-3">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 opacity-60" />
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">No Topics in this View</div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                {activeTab === "due"
                  ? "You have no topics pending review right now. All revisions are up to date!"
                  : "No revision topics match this filter."}
              </p>
            </div>
          </div>
        ) : (
          displayedList.map((topic) => (
            <motion.div
              key={topic._id}
              layout
              className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {topic.title || topic.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {topic.subjectName || topic.examName || "Core Topic"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--border)]">
                    Revision #{topic.revisionCount || 1}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-[var(--ink-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Due Date: {topic.nextRevisionDate || "Today"}
                  </span>
                  <span>Confidence: {topic.confidenceRating || "Moderate"}</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setRevisionModalTopic(topic);
                  setSelectedRating("moderate");
                }}
                className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shrink-0"
              >
                Log Review
              </Button>
            </motion.div>
          ))
        )}
      </div>

      {/* 3. Log Review Modal with Confidence Feedback */}
      {revisionModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
                  Spaced Repetition Feedback
                </span>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  How well did you remember "{revisionModalTopic.title}"?
                </h3>
              </div>
              <button
                onClick={() => setRevisionModalTopic(null)}
                className="p-1 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {CONFIDENCE_RATINGS.map((rate) => {
                const isSelected = selectedRating === rate.id;
                return (
                  <button
                    key={rate.id}
                    type="button"
                    onClick={() => setSelectedRating(rate.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      isSelected
                        ? "bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 font-bold"
                        : `bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink)] ${rate.color}`
                    }`}
                  >
                    <span className="text-xl">{rate.icon}</span>
                    <span className="text-xs font-semibold">{rate.label}</span>
                    <span className="text-[9px] text-[var(--ink-muted)] leading-tight">{rate.sub}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Revision Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Key takeaways, formulas, or pitfalls..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setRevisionModalTopic(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completeRevisionMutation.isPending}
                className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Confirm & Reschedule Interval
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

