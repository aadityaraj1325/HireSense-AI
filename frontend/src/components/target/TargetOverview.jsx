import React from "react";
import { motion } from "framer-motion";
import {
  Target,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  CalendarDays,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Scale,
  RefreshCw,
  BookOpen,
  Layers,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TargetOverview({
  dashboard = {},
  realityScore = {},
  recoveryData = {},
  onOpenRealityModal,
  onOpenRecoveryModal,
  onOpenCoachDrawer,
  onNavigateTab,
  onPlanTomorrow,
}) {
  const completionPct = dashboard.completionPct ?? 0;
  const completedTasks = dashboard.completedTasks ?? 0;
  const pendingTasks = dashboard.pendingTasks ?? 0;
  const studyHoursToday = dashboard.studyHoursToday ?? 0;
  const currentStreak = dashboard.currentStreak ?? 0;
  const weeklyCompletionRate = dashboard.weeklyCompletionRate ?? 0;
  const upcomingExam = dashboard.upcomingExam;
  const totalGoalsCompleted = dashboard.totalGoalsCompleted ?? 0;

  const score = realityScore.score ?? 75;
  const level = realityScore.level ?? realityScore.grade ?? "Moderate Alignment";
  const unfinishedCount = recoveryData.totalUnfinished ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Motivation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-500/10 via-[var(--surface)] to-blue-500/10 border border-purple-500/20 shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Target size={13} />
            <span>Target — Your Personal Growth Command Center</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
            Plan Tonight, Execute Today.
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-xl">
            Plan your day, complete your goals, track your progress, and build consistency with spaced-repetition intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={onPlanTomorrow}
            className="rounded-2xl text-xs flex items-center gap-1.5 border-purple-500/30 hover:border-purple-500 font-semibold"
          >
            <CalendarDays size={14} className="text-purple-500" />
            <span>Plan Tomorrow</span>
          </Button>

          <Button
            onClick={onOpenCoachDrawer}
            className="rounded-2xl text-xs flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-md"
          >
            <Sparkles size={14} />
            <span>AI Target Coach</span>
          </Button>
        </div>
      </div>

      {/* 2. Goal Recovery Alert Banner (if past missed tasks exist) */}
      {unfinishedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/30">
              <RefreshCw size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--ink)]">
                Goal Recovery Opportunity ({unfinishedCount} unfinished tasks)
              </div>
              <div className="text-[11px] text-[var(--ink-muted)]">
                You have unfinished tasks from recent days. Reschedule them safely without overwhelming your schedule.
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onOpenRecoveryModal}
            className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer shrink-0"
          >
            Recover Goals
          </Button>
        </motion.div>
      )}

      {/* 3. Summary 8 Metric Cards (100% Real User Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Today's Completion % */}
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Completion %</div>
          <div className="text-xl sm:text-2xl font-black font-display text-purple-600 dark:text-purple-400">
            {completionPct}%
          </div>
          <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, completionPct)}%` }}
            />
          </div>
        </div>

        {/* 2. Today's Completed Tasks */}
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Completed</div>
          <div className="text-xl sm:text-2xl font-black font-display text-emerald-500">
            {completedTasks}
          </div>
          <div className="text-[10px] text-[var(--ink-muted)]">tasks finished today</div>
        </div>

        {/* 3. Pending Tasks */}
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Pending</div>
          <div className="text-xl sm:text-2xl font-black font-display text-amber-500">
            {pendingTasks}
          </div>
          <div className="text-[10px] text-[var(--ink-muted)]">remaining on agenda</div>
        </div>

        {/* 4. Study Hours */}
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Study Hours</div>
          <div className="text-xl sm:text-2xl font-black font-display text-[var(--ink)]">
            {studyHoursToday}h
          </div>
          <div className="text-[10px] text-[var(--ink-muted)]">focused time logged</div>
        </div>

        {/* 5. Current Streak */}
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
          <div className="text-[11px] text-[var(--ink-muted)] font-medium flex items-center justify-between">
            <span>Streak</span>
            <Flame size={12} className="text-orange-500 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-display text-orange-500 flex items-center gap-1">
            <span>{currentStreak}</span>
            <span className="text-xs font-normal text-[var(--ink-muted)]">days</span>
          </div>
          <div className="text-[10px] text-[var(--ink-muted)]">consecutive active</div>
        </div>

        {/* 6. Weekly Completion Rate */}
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Weekly Rate</div>
          <div className="text-xl sm:text-2xl font-black font-display text-blue-500">
            {weeklyCompletionRate}%
          </div>
          <div className="text-[10px] text-[var(--ink-muted)]">last 7 days rate</div>
        </div>

        {/* 7. Upcoming Exam */}
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Upcoming Exam</div>
          <div className="text-xl sm:text-2xl font-black font-display text-[var(--ink)] truncate">
            {upcomingExam ? `${upcomingExam.daysUntil}d` : "None"}
          </div>
          <div className="text-[10px] text-[var(--ink-muted)] truncate">
            {upcomingExam ? upcomingExam.title : "No exam in 30d"}
          </div>
        </div>

        {/* 8. Total Goals Completed */}
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
          <div className="text-[11px] text-[var(--ink-muted)] font-medium">Total Goals</div>
          <div className="text-xl sm:text-2xl font-black font-display text-indigo-500">
            {totalGoalsCompleted}
          </div>
          <div className="text-[10px] text-[var(--ink-muted)]">all-time completed</div>
        </div>
      </div>

      {/* 4. Goal Reality Score & Today's Schedule Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Goal Reality Score Card (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Scale size={18} />
              </div>
              <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                Goal Reality Score
              </h3>
            </div>
            <button
              onClick={onOpenRealityModal}
              className="text-xs font-semibold text-purple-500 hover:text-purple-600 transition-colors cursor-pointer"
            >
              Learn More
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center space-y-2">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Sparkles size={11} />
              <span>{level}</span>
            </div>

            <div className="flex items-baseline justify-center gap-1">
              <span className="font-display text-4xl sm:text-5xl font-black text-[var(--ink)]">
                {score}
              </span>
              <span className="text-sm font-semibold text-[var(--ink-muted)]">/ 100</span>
            </div>

            <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
              {realityScore.feedback || realityScore.description || "Consistent execution alignment."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--ink-muted)]">Planned</div>
              <div className="font-bold text-[var(--ink)] mt-0.5">{realityScore.plannedHours || 0}h</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--ink-muted)]">Executed</div>
              <div className="font-bold text-emerald-500 mt-0.5">{realityScore.actualHours || 0}h</div>
            </div>
          </div>
        </div>

        {/* Today's Focus & Quick Links (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Clock size={18} />
              </div>
              <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                Today's Quick Focus & Workspace Modules
              </h3>
            </div>

            <button
              onClick={() => onNavigateTab("planning")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-500 hover:text-purple-600 cursor-pointer"
            >
              <span>Full Daily Planner</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Daily Planner Card */}
            <div
              onClick={() => onNavigateTab("planning")}
              className="p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-105 transition-transform">
                  <CalendarDays size={18} />
                </div>
                <ArrowRight size={14} className="text-[var(--ink-muted)] group-hover:text-purple-500 transition-colors" />
              </div>
              <div className="font-bold text-xs text-[var(--ink)]">Daily Planning</div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Plan tomorrow tonight. Time blocks, priority filters & subtasks.
              </p>
            </div>

            {/* Routine Card */}
            <div
              onClick={() => onNavigateTab("routine")}
              className="p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={18} />
                </div>
                <ArrowRight size={14} className="text-[var(--ink-muted)] group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="font-bold text-xs text-[var(--ink)]">My Routine</div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Recurring habits, adherence tracking & daily time block checklist.
              </p>
            </div>

            {/* Exam Planner Card */}
            <div
              onClick={() => onNavigateTab("exam")}
              className="p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
                  <GraduationCap size={18} />
                </div>
                <ArrowRight size={14} className="text-[var(--ink-muted)] group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="font-bold text-xs text-[var(--ink)]">Exam & Syllabus</div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Target exams, subject weightage & mastery progress bars.
              </p>
            </div>

            {/* Revision Center Card */}
            <div
              onClick={() => onNavigateTab("revision")}
              className="p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
                  <Layers size={18} />
                </div>
                <ArrowRight size={14} className="text-[var(--ink-muted)] group-hover:text-indigo-500 transition-colors" />
              </div>
              <div className="font-bold text-xs text-[var(--ink)]">Revision Center</div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Smart spaced repetition (1, 3, 7, 14, 30 days) retention cycles.
              </p>
            </div>

            {/* Document Notes */}
            <div
              onClick={() => onNavigateTab("notes")}
              className="p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                  <BookOpen size={18} />
                </div>
                <ArrowRight size={14} className="text-[var(--ink-muted)] group-hover:text-amber-500 transition-colors" />
              </div>
              <div className="font-bold text-xs text-[var(--ink)]">Notes & Documents</div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Rich text editor with headings, code blocks, checklists & tags.
              </p>
            </div>

            {/* Daily Journal */}
            <div
              onClick={() => onNavigateTab("journal")}
              className="p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-105 transition-transform">
                  <Clock size={18} />
                </div>
                <ArrowRight size={14} className="text-[var(--ink-muted)] group-hover:text-rose-500 transition-colors" />
              </div>
              <div className="font-bold text-xs text-[var(--ink)]">Evening Journal</div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                "What did I do today?" Evening reflection & mood tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

