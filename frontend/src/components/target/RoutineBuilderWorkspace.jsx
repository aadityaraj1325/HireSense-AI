import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Sparkles,
  Repeat,
  Trash2,
  Edit2,
  X,
  Calendar,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  useTargetRoutines,
  useCreateTargetRoutine,
  useToggleTargetRoutine,
  useDeleteTargetRoutine,
} from "@/hooks/useTarget";

const ROUTINE_CATEGORIES = [
  { id: "morning_routine", label: "Morning Routine" },
  { id: "study_block", label: "Study Block" },
  { id: "coding_session", label: "Coding Session" },
  { id: "college_work", label: "College Work" },
  { id: "revision_slot", label: "Revision Slot" },
  { id: "workout", label: "Workout / Health" },
  { id: "night_review", label: "Night Review & Plan" },
  { id: "break", label: "Recharge Break" },
];

export function RoutineBuilderWorkspace() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routineForm, setRoutineForm] = useState({
    title: "",
    startTime: "07:00",
    endTime: "08:00",
    category: "study_block",
    recurringType: "all_days",
    notes: "",
  });

  const { data: routines = [], isLoading } = useTargetRoutines();
  const createRoutineMutation = useCreateTargetRoutine();
  const toggleRoutineMutation = useToggleTargetRoutine();
  const deleteRoutineMutation = useDeleteTargetRoutine();

  const todayStr = new Date().toISOString().split("T")[0];

  // Adherence calculation
  const completedTodayCount = routines.filter((r) =>
    r.completions?.some((c) => c.date === todayStr && c.completed)
  ).length;

  const adherenceRate = routines.length > 0 ? Math.round((completedTodayCount / routines.length) * 100) : 100;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!routineForm.title.trim()) return;

    try {
      await createRoutineMutation.mutateAsync(routineForm);
      setIsModalOpen(false);
      setRoutineForm({
        title: "",
        startTime: "07:00",
        endTime: "08:00",
        category: "study_block",
        recurringType: "all_days",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to create routine block:", err);
    }
  };

  const handleToggle = (routineId) => {
    toggleRoutineMutation.mutate({ id: routineId, date: todayStr });
  };

  return (
    <div className="space-y-6">
      {/* 1. Routine Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Repeat size={13} />
            <span>My Daily Routine Builder</span>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--ink)]">
            Anchor Habits & Recurring Blocks
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Consistent routines automate your discipline. Check off routine blocks as you flow through your day.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center min-w-[120px]">
            <div className="text-[11px] text-[var(--ink-muted)]">Today's Adherence</div>
            <div className="text-lg font-black font-display text-emerald-500 mt-0.5">
              {adherenceRate}% <span className="text-xs font-normal text-[var(--ink-muted)]">({completedTodayCount}/{routines.length})</span>
            </div>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Routine Block</span>
          </Button>
        </div>
      </div>

      {/* 2. Routines List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-xs text-[var(--ink-muted)]">
            Loading your routine blocks...
          </div>
        ) : routines.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--border)] space-y-3">
            <Repeat size={36} className="mx-auto text-[var(--ink-muted)] opacity-50" />
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">No routine blocks created yet</div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Set up your recurring morning study, coding blocks, or evening planning routine.
              </p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-xl text-xs">
              Create First Routine Block
            </Button>
          </div>
        ) : (
          routines.map((routine) => {
            const isCompletedToday = routine.completions?.some((c) => c.date === todayStr && c.completed);

            return (
              <motion.div
                key={routine._id}
                layout
                className={`p-4 rounded-3xl border transition-all flex items-start justify-between gap-3 ${
                  isCompletedToday
                    ? "bg-emerald-500/5 border-emerald-500/25 shadow-sm"
                    : "bg-[var(--surface)] border-[var(--border)] shadow-sm hover:shadow-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(routine._id)}
                    className="mt-0.5 cursor-pointer hover:scale-110 transition-transform"
                  >
                    {isCompletedToday ? (
                      <CheckCircle2 size={22} className="text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle size={22} className="text-[var(--ink-muted)] hover:text-emerald-500" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isCompletedToday ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-[var(--ink)]"}`}>
                        {routine.title}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--border)]">
                        {routine.recurringType.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--ink-muted)]">
                      <span className="flex items-center gap-1 font-mono font-medium">
                        <Clock size={12} />
                        {routine.startTime} – {routine.endTime}
                      </span>
                      <span className="capitalize">{routine.category.replace("_", " ")}</span>
                    </div>

                    {routine.notes && (
                      <p className="text-[11px] text-[var(--ink-muted)] mt-1">{routine.notes}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteRoutineMutation.mutate(routine._id)}
                  className="p-1.5 rounded-xl hover:bg-red-500/10 text-[var(--ink-muted)] hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 3. Add Routine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                Add Routine Block
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Routine Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning 2h Deep Coding Slot"
                  value={routineForm.title}
                  onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={routineForm.startTime}
                    onChange={(e) => setRoutineForm({ ...routineForm, startTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">End Time</label>
                  <input
                    type="time"
                    value={routineForm.endTime}
                    onChange={(e) => setRoutineForm({ ...routineForm, endTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Recurring Days</label>
                  <select
                    value={routineForm.recurringType}
                    onChange={(e) => setRoutineForm({ ...routineForm, recurringType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  >
                    <option value="all_days">All Days</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="weekends">Weekends Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Category</label>
                  <select
                    value={routineForm.category}
                    onChange={(e) => setRoutineForm({ ...routineForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  >
                    {ROUTINE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Optional habit trigger, location, or goals..."
                  value={routineForm.notes}
                  onChange={(e) => setRoutineForm({ ...routineForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoutineMutation.isPending} className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer">
                  {createRoutineMutation.isPending ? "Adding..." : "Add Routine Block"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

