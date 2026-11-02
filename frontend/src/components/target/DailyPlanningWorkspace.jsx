import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Filter,
  Trash2,
  CalendarDays,
  Tag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  useTargetTasks,
  useCreateTargetTask,
  useUpdateTargetTask,
  useDeleteTargetTask,
  useRescheduleTargetTask,
} from "@/hooks/useTarget";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "coding", label: "Coding" },
  { id: "dsa", label: "DSA" },
  { id: "project", label: "Project" },
  { id: "exam_prep", label: "Exam Prep" },
  { id: "placement", label: "Placement" },
  { id: "college", label: "College" },
  { id: "personal", label: "Personal" },
  { id: "health", label: "Health" },
];

const PRIORITIES = [
  { id: "all", label: "All Priorities" },
  { id: "critical", label: "Critical", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  { id: "high", label: "High", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  { id: "medium", label: "Medium", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "low", label: "Low", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
];

export function DailyPlanningWorkspace({ initialDate }) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(initialDate || todayStr);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescheduleModalTask, setRescheduleModalTask] = useState(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState(tomorrowStr);

  // New task form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    startTime: "09:00",
    endTime: "10:30",
    priority: "medium",
    category: "coding",
    expectedMinutes: 90,
    subtasks: [],
  });
  const [subtaskInput, setSubtaskInput] = useState("");

  const { data: tasks = [], isLoading } = useTargetTasks(selectedDate);
  const createTaskMutation = useCreateTargetTask();
  const updateTaskMutation = useUpdateTargetTask();
  const deleteTaskMutation = useDeleteTargetTask();
  const rescheduleMutation = useRescheduleTargetTask();

  const isTomorrow = selectedDate === tomorrowStr;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;
      return true;
    });
  }, [tasks, selectedCategory, selectedPriority]);

  const totalPlannedHours = useMemo(() => {
    const mins = tasks.reduce((acc, t) => acc + (t.expectedDuration || t.expectedMinutes || 60), 0);
    return Math.round((mins / 60) * 10) / 10;
  }, [tasks]);

  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.status === "completed").length;
  }, [tasks]);

  // Handle task completion toggle
  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    await updateTaskMutation.mutateAsync({
      id: task._id,
      data: { status: nextStatus },
    });
  };

  // Add subtask to form
  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setTaskForm((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, { title: subtaskInput.trim(), completed: false }],
    }));
    setSubtaskInput("");
  };

  // Handle create task submission
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        ...taskForm,
        date: selectedDate,
      });

      setIsModalOpen(false);
      setTaskForm({
        title: "",
        description: "",
        startTime: "09:00",
        endTime: "10:30",
        priority: "medium",
        category: "coding",
        expectedMinutes: 90,
        subtasks: [],
      });
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  // Handle reschedule action
  const handleConfirmReschedule = async () => {
    if (!rescheduleModalTask) return;
    await rescheduleMutation.mutateAsync({
      id: rescheduleModalTask._id,
      newDate: newRescheduleDate,
    });
    setRescheduleModalTask(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Planning Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isTomorrow
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              Tomorrow (Plan Tonight)
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-[var(--ink-muted)]">
            <span className="font-bold text-[var(--ink)]">{completedCount}</span> / {tasks.length} done ({totalPlannedHours}h planned)
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* 2. "Plan Tomorrow Tonight" Motivation Banner */}
      {isTomorrow && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-purple-500/20 text-purple-500">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--ink)]">
                Preparing Tomorrow's Schedule Tonight
              </div>
              <div className="text-[11px] text-[var(--ink-muted)]">
                Deciding your high-priority goals tonight eliminates morning decision fatigue and builds consistent execution momentum.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold"
                  : "bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Tasks List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--ink-muted)]">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--border)] space-y-3">
            <CalendarDays size={36} className="mx-auto text-[var(--ink-muted)] opacity-50" />
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">No tasks scheduled for this date</div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Click "Add Task" to plan your time blocks and lock in your goals.
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="rounded-xl text-xs"
            >
              Add First Task
            </Button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "completed";
            const priorityObj = PRIORITIES.find((p) => p.id === task.priority) || PRIORITIES[3];

            return (
              <motion.div
                key={task._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-3xl border transition-all ${
                  isDone
                    ? "bg-[var(--surface-2)]/60 border-[var(--border)] opacity-75"
                    : "bg-[var(--surface)] border-[var(--border)] shadow-sm hover:shadow-card"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="mt-0.5 text-purple-600 dark:text-purple-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle size={20} className="text-[var(--ink-muted)] hover:text-purple-500" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold ${
                            isDone ? "line-through text-[var(--ink-muted)]" : "text-[var(--ink)]"
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityObj.color}`}
                        >
                          {task.priority}
                        </span>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--border)] uppercase">
                          {task.category}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-[var(--ink-muted)] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {task.startTime || "09:00"} – {task.endTime || "10:30"} ({task.expectedDuration || task.expectedMinutes || 60}m)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setRescheduleModalTask(task);
                        setNewRescheduleDate(tomorrowStr);
                      }}
                      title="Reschedule to another day"
                      className="p-1.5 rounded-xl hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-purple-500 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={15} />
                    </button>

                    <button
                      onClick={() => deleteTaskMutation.mutate(task._id)}
                      title="Delete task"
                      className="p-1.5 rounded-xl hover:bg-red-500/10 text-[var(--ink-muted)] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 5. Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                Add New Task ({selectedDate})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Binary Search Trees & Solve 4 LeetCode problems"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Description / Specific Deliverables
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details, links, or notes..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                    Category
                  </label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="coding">Coding</option>
                    <option value="dsa">DSA</option>
                    <option value="project">Project</option>
                    <option value="exam_prep">Exam Prep</option>
                    <option value="placement">Placement</option>
                    <option value="college">College</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Start</label>
                  <input
                    type="time"
                    value={taskForm.startTime}
                    onChange={(e) => setTaskForm({ ...taskForm, startTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">End</label>
                  <input
                    type="time"
                    value={taskForm.endTime}
                    onChange={(e) => setTaskForm({ ...taskForm, endTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Est. Mins</label>
                  <input
                    type="number"
                    min={15}
                    max={720}
                    step={15}
                    value={taskForm.expectedMinutes}
                    onChange={(e) => setTaskForm({ ...taskForm, expectedMinutes: parseInt(e.target.value, 10) || 60 })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending} className="rounded-xl text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer">
                  {createTaskMutation.isPending ? "Adding..." : "Add to Schedule"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 6. Reschedule Modal */}
      {rescheduleModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                Reschedule Task
              </h3>
              <button onClick={() => setRescheduleModalTask(null)} className="p-1 rounded-full hover:bg-[var(--surface-2)]">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[var(--ink-muted)]">
              Move "<strong className="text-[var(--ink)]">{rescheduleModalTask.title}</strong>" to a new date:
            </p>

            <input
              type="date"
              value={newRescheduleDate}
              onChange={(e) => setNewRescheduleDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRescheduleModalTask(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReschedule}
                disabled={rescheduleMutation.isPending}
                className="rounded-xl text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                Confirm Reschedule
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

