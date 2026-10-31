import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Clock3, FilePenLine, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const pad = (value) => String(value).padStart(2, "0");
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const todayKey = dateKey(new Date());

function taskDate(task, roadmap) {
  if (task.scheduledFor) return dateKey(new Date(task.scheduledFor));
  const start = new Date(roadmap.createdAt || Date.now());
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + ((task.week || 1) - 1) * 7 + (task.day || 1) - 1);
  return dateKey(start);
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function statusFor(tasks, key) {
  if (!tasks.length) return "empty";
  const completed = tasks.filter((task) => task.status === "completed").length;
  if (completed === tasks.length) return "completed";
  if (completed > 0) return "partial";
  return parseDate(key) < new Date(new Date().setHours(0, 0, 0, 0)) ? "missed" : "pending";
}

const statusClass = {
  completed: "border-[#42b883]/40 bg-[#d9f3e5] text-[#207a50] dark:bg-[#173c2b] dark:text-[#8de2b2]",
  partial: "border-[#d7a33b]/40 bg-[#fff0c8] text-[#9a6508] dark:bg-[#493918] dark:text-[#f2c56c]",
  missed: "border-[#c96d75]/35 bg-[#f7dddd] text-[#9d4c55] dark:bg-[#47272e] dark:text-[#f3a5ab]",
  pending: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-muted)]",
  empty: "border-transparent text-[var(--ink-muted)]",
};

export function LearningCalendar({ roadmap, onOpenNote, onDateChange }) {
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const tasks = useMemo(() => roadmap?.dailyTasks || [], [roadmap?.dailyTasks]);
  const byDate = useMemo(() => tasks.reduce((map, task) => {
    const key = taskDate(task, roadmap);
    map[key] = [...(map[key] || []), task];
    return map;
  }, {}), [tasks, roadmap]);
  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, index) => {
      const day = index - offset + 1;
      return day < 1 || day > total ? null : new Date(month.getFullYear(), month.getMonth(), day);
    });
  }, [month]);
  const selectedTasks = byDate[selectedDate] || [];
  const selectedStatus = statusFor(selectedTasks, selectedDate);
  const selectedDateObject = parseDate(selectedDate);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2"><NotebookPen size={19} className="text-[var(--accent-strong)]" /> My Learning Calendar</CardTitle>
          <CardDescription className="mt-1">Real task completion, study time, and notes from your roadmap.</CardDescription>
        </div>
        <Badge tone="success">Live progress</Badge>
      </CardHeader>
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h3 className="font-display text-xl font-semibold">{monthLabel}</h3>
        <div className="flex gap-1">
          <Button size="iconSm" variant="ghost" aria-label="Previous month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}><ChevronLeft size={17} /></Button>
          <Button size="iconSm" variant="ghost" aria-label="Next month" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}><ChevronRight size={17} /></Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((day, index) => <div key={`${day}-${index}`} className="pb-1 text-center text-xs font-semibold text-[var(--ink-muted)]">{day}</div>)}
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="min-h-12 sm:min-h-16" />;
          const key = dateKey(date);
          const status = statusFor(byDate[key] || [], key);
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          return (
            <motion.button
              type="button"
              key={key}
              whileHover={{ y: -2 }}
              onClick={() => { setSelectedDate(key); onDateChange?.(key); }}
              className={`min-h-12 rounded-xl border p-1.5 text-center transition sm:min-h-16 sm:p-2 ${statusClass[status]} ${isSelected ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]" : ""} ${isToday ? "outline outline-1 outline-[var(--accent-strong)]/60" : ""}`}
              aria-label={`${date.toLocaleDateString()} ${status}`}
            >
              <span className="text-sm font-semibold">{date.getDate()}</span>
              {byDate[key]?.length > 0 && <span className="mt-1 block text-[10px] opacity-75">{byDate[key].filter((task) => task.status === "completed").length}/{byDate[key].length}</span>}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-b border-[var(--border)] pb-5 text-xs text-[var(--ink-muted)]">
        {[["completed", "Completed"], ["partial", "Partial"], ["missed", "Missed"], ["pending", "Not started"]].map(([status, label]) => <span key={status} className="inline-flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${statusClass[status].split(" ")[1]}`} />{label}</span>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={selectedDate} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-display text-lg font-semibold">Selected day — {selectedDateObject.toLocaleDateString(undefined, { day: "2-digit", month: "long" })}</h3><p className="mt-1 text-sm text-[var(--ink-muted)]">Daily learning record · {selectedTasks.filter((task) => task.status === "completed").length}/{selectedTasks.length || 0} tasks complete</p></div>
            <Button size="sm" variant="soft" onClick={() => onOpenNote?.(selectedDate)}><FilePenLine size={14} /> Open journal</Button>
          </div>
          {selectedTasks.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{selectedTasks.map((task) => <div key={task._id} className="flex items-start gap-2 rounded-xl bg-[var(--surface-2)] p-3 text-sm"><BookOpen size={15} className="mt-0.5 shrink-0 text-[var(--accent-strong)]" /><span className={task.status === "completed" ? "text-[var(--ink-muted)] line-through" : ""}>{task.title}<span className="mt-1 flex items-center gap-1 text-xs text-[var(--ink-muted)]"><Clock3 size={11} /> {task.estimatedMinutes || 30} min</span></span></div>)}</div> : <p className="mt-4 rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-muted)]">No learning activity is scheduled for this date.</p>}
          {selectedStatus === "missed" && <p className="mt-3 text-xs text-[var(--warning)]">This scheduled learning day has passed without completed tasks. You can continue it from the milestone tracker.</p>}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
