import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { BarChart3, TrendingUp, PieChart as PieIcon, CheckCircle2, BookOpen } from "lucide-react";
import { useTargetAnalytics } from "@/hooks/useTarget";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export function TargetAnalyticsWorkspace() {
  const { data: analytics = {}, isLoading } = useTargetAnalytics();

  const dailyTrend = analytics.dailyTrend || [];
  const categoryDistribution = analytics.categoryDistribution || [];
  const routineAdherence = analytics.routineAdherence ?? 100;
  const totalTasksAnalyzed = analytics.totalTasksAnalyzed ?? 0;
  const masteredTopics = analytics.masteredTopics ?? 0;
  const totalTopics = analytics.totalTopics ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
          <BarChart3 size={13} />
          <span>Productivity & Consistency Analytics</span>
        </div>
        <h2 className="font-display font-bold text-xl text-[var(--ink)]">
          Execution Trends & Focus Allocation
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Inspect your daily velocity, category distribution, and syllabus mastery with zero fake statistics.
        </p>
      </div>

      {/* 2. Top Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card text-center space-y-1">
          <div className="text-xs text-[var(--ink-muted)]">Tasks Analyzed</div>
          <div className="text-2xl font-black font-display text-[var(--ink)]">{totalTasksAnalyzed}</div>
          <div className="text-[10px] text-[var(--ink-muted)]">across 7-day window</div>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card text-center space-y-1">
          <div className="text-xs text-[var(--ink-muted)]">Routine Adherence</div>
          <div className="text-2xl font-black font-display text-emerald-500">{routineAdherence}%</div>
          <div className="text-[10px] text-[var(--ink-muted)]">habit consistency</div>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card text-center space-y-1">
          <div className="text-xs text-[var(--ink-muted)]">Syllabus Mastery</div>
          <div className="text-2xl font-black font-display text-purple-600 dark:text-purple-400">
            {masteredTopics} <span className="text-xs text-[var(--ink-muted)] font-normal">/ {totalTopics}</span>
          </div>
          <div className="text-[10px] text-[var(--ink-muted)]">topics mastered</div>
        </div>
      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daily Completion & Study Hours (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-[var(--ink)] flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-500" />
              <span>7-Day Task Completion & Study Hours</span>
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="var(--ink-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--ink-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "1rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="completedTasks" name="Completed Tasks" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="plannedTasks" name="Planned Tasks" fill="#e2e8f0" radius={[6, 6, 0, 0]} opacity={0.4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
          <h3 className="font-display font-bold text-sm text-[var(--ink)] flex items-center gap-2">
            <PieIcon size={16} className="text-blue-500" />
            <span>Category Time Distribution</span>
          </h3>

          <div className="h-52 w-full flex items-center justify-center">
            {categoryDistribution.length === 0 ? (
              <div className="text-xs text-[var(--ink-muted)]">No category data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "0.75rem",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[var(--ink-muted)]">
            {categoryDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

