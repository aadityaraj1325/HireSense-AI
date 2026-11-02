import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTargetCalendar } from "@/hooks/useTarget";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TargetCalendarWorkspace({ onSelectDayForPlanning }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const { data: calendarData = {}, isLoading } = useTargetCalendar({
    year,
    month,
  });

  const monthDaysData = calendarData.days || {};

  // First day of month and total days
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDayInfo(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDayInfo(null);
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <CalendarDays size={13} />
            <span>Interactive Execution Calendar</span>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--ink)]">
            Monthly Productivity Matrix
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Color-coded heatmap of daily goal execution, study hours, and exam deadlines.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink)] transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-display font-bold text-sm text-[var(--ink)] min-w-[130px] text-center">
            {monthName} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink)] transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. Color Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink-muted)]">
        <span className="font-semibold text-[var(--ink)]">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>&gt;80% Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>40-79% Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>&lt;40% Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Deep Study (&gt;4h)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Exam Date</span>
        </div>
      </div>

      {/* 3. Calendar Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Grid (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card space-y-3">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--ink-muted)]">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank cells for offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-16 rounded-2xl bg-transparent" />
            ))}

            {/* Actual month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${monthPrefix}-${String(dayNum).padStart(2, "0")}`;
              const dayData = monthDaysData[dateStr] || {};

              const totalTasks = dayData.totalTasks || 0;
              const completedTasks = dayData.completedTasks || 0;
              const studyHours = dayData.studyHours || 0;
              const hasExam = !!dayData.hasExam;
              const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

              // Color determination
              let bgPill = "bg-[var(--surface-2)] border-[var(--border)]";
              let badgeDot = null;

              if (hasExam) {
                badgeDot = "bg-blue-500 ring-2 ring-blue-500/30";
              } else if (studyHours >= 4) {
                badgeDot = "bg-purple-500";
              } else if (totalTasks > 0) {
                if (completionRate >= 80) badgeDot = "bg-emerald-500";
                else if (completionRate >= 40) badgeDot = "bg-amber-500";
                else badgeDot = "bg-red-500";
              }

              const isSelected = selectedDayInfo?.date === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDayInfo({ date: dateStr, ...dayData })}
                  className={`h-16 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-purple-500/15 border-purple-500 shadow-sm ring-1 ring-purple-500/30"
                      : "bg-[var(--surface-2)] border-[var(--border)] hover:border-purple-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--ink)]">{dayNum}</span>
                    {badgeDot && <span className={`w-2 h-2 rounded-full ${badgeDot}`} />}
                  </div>

                  <div className="text-[10px] text-[var(--ink-muted)] truncate">
                    {hasExam ? (
                      <span className="text-blue-500 font-bold">Exam!</span>
                    ) : totalTasks > 0 ? (
                      <span>{completedTasks}/{totalTasks} done</span>
                    ) : (
                      studyHours > 0 && <span>{studyHours}h</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-display font-bold text-sm text-[var(--ink)]">
              Day Inspector
            </h3>
            <span className="text-xs font-mono text-[var(--ink-muted)]">
              {selectedDayInfo?.date || "Select a date"}
            </span>
          </div>

          {!selectedDayInfo ? (
            <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
              Click any calendar day to inspect scheduled goals, study hours, and journal reflections.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--ink-muted)]">Tasks Done</div>
                  <div className="text-base font-bold text-emerald-500 mt-0.5">
                    {selectedDayInfo.completedTasks || 0} / {selectedDayInfo.totalTasks || 0}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="text-[10px] text-[var(--ink-muted)]">Study Hours</div>
                  <div className="text-base font-bold text-[var(--ink)] mt-0.5">
                    {selectedDayInfo.studyHours || 0}h
                  </div>
                </div>
              </div>

              {selectedDayInfo.hasExam && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-500 font-bold flex items-center gap-2">
                  <GraduationCap size={16} />
                  <span>Exam scheduled on this date!</span>
                </div>
              )}

              <Button
                onClick={() => onSelectDayForPlanning?.(selectedDayInfo.date)}
                className="w-full rounded-xl text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer"
              >
                Open in Daily Planner
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

