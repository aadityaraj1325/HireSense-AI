import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  ChevronRight,
  Flame,
  Sparkles,
  Zap,
  Filter,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  useTargetExams,
  useCreateTargetExam,
  useDeleteTargetExam,
  useTargetTopics,
  useCreateTargetTopic,
  useUpdateTargetTopic,
  useDeleteTargetTopic,
} from "@/hooks/useTarget";

const STATUS_OPTIONS = [
  { id: "not_started", label: "Not Started", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  { id: "learning", label: "Learning", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { id: "completed", label: "Completed", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { id: "needs_revision", label: "Needs Revision", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { id: "mastered", label: "Mastered", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
];

const PRIORITY_LEVELS = [
  {
    rank: 1,
    priority: "high",
    label: "1st Priority (Must-Know / Core)",
    shortLabel: "1st Priority",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    headerBadge: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    icon: "🔥",
    desc: "Highest weightage topics to conquer first",
  },
  {
    rank: 2,
    priority: "medium",
    label: "2nd Priority (Important / Secondary)",
    shortLabel: "2nd Priority",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    headerBadge: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    icon: "⚡",
    desc: "High-yield topics essential for strong scoring",
  },
  {
    rank: 3,
    priority: "low",
    label: "3rd Priority (Supplementary / Optional)",
    shortLabel: "3rd Priority",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    headerBadge: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    icon: "📘",
    desc: "Foundation & peripheral topics to review if time permits",
  },
];

const SYLLABUS_PRESETS = [
  {
    name: "Computer Networks (CN)",
    subjectName: "Computer Networks",
    topics: [
      { title: "TCP/IP Protocol Suite & 3-Way Handshake", priorityRank: 1, difficulty: "medium", estimatedHours: 3 },
      { title: "Flow & Congestion Control (TCP Tahoe/Reno, Sliding Window)", priorityRank: 1, difficulty: "hard", estimatedHours: 4 },
      { title: "IP Addressing, Subnetting & CIDR Calculation", priorityRank: 1, difficulty: "medium", estimatedHours: 3 },
      { title: "Routing Protocols (OSPF, BGP, Distance Vector, Link State)", priorityRank: 1, difficulty: "hard", estimatedHours: 4 },
      { title: "OSI 7-Layer Reference Model & Layer Functions", priorityRank: 2, difficulty: "easy", estimatedHours: 2 },
      { title: "Application Protocols: DNS, HTTP/HTTPS, DHCP, SMTP", priorityRank: 2, difficulty: "medium", estimatedHours: 2.5 },
      { title: "Data Link Layer: ARP, RARP, MAC Addressing & Framing", priorityRank: 2, difficulty: "medium", estimatedHours: 2 },
      { title: "Socket Programming & UDP vs TCP Transport Analysis", priorityRank: 2, difficulty: "medium", estimatedHours: 3 },
      { title: "Network Security Basics: Firewalls, NAT & TLS Encryption", priorityRank: 3, difficulty: "medium", estimatedHours: 2 },
      { title: "Error Detection: CRC, Parity & Checksum Computation", priorityRank: 3, difficulty: "medium", estimatedHours: 2 },
    ],
  },
  {
    name: "Operating Systems (OS)",
    subjectName: "Operating Systems",
    topics: [
      { title: "Process Synchronization: Critical Section, Semaphores & Mutex", priorityRank: 1, difficulty: "hard", estimatedHours: 4 },
      { title: "CPU Scheduling Algorithms: FCFS, SJF, Round Robin, Priority", priorityRank: 1, difficulty: "medium", estimatedHours: 3 },
      { title: "Virtual Memory, Paging, Segmentation & Page Replacement (LRU)", priorityRank: 1, difficulty: "hard", estimatedHours: 4 },
      { title: "Deadlocks: Banker's Algorithm, Prevention & Avoidance", priorityRank: 1, difficulty: "hard", estimatedHours: 3.5 },
      { title: "Threads & Concurrency: User vs Kernel Threads & Context Switching", priorityRank: 2, difficulty: "medium", estimatedHours: 2.5 },
      { title: "System Calls, Fork, Exec & Process Life Cycle", priorityRank: 2, difficulty: "medium", estimatedHours: 2 },
      { title: "Disk Scheduling: FCFS, SSTF, SCAN, C-LOOK", priorityRank: 2, difficulty: "medium", estimatedHours: 2 },
      { title: "Memory Allocation: First Fit, Best Fit, Worst Fit & Fragmentation", priorityRank: 3, difficulty: "easy", estimatedHours: 2 },
    ],
  },
  {
    name: "DBMS & SQL",
    subjectName: "DBMS",
    topics: [
      { title: "Normalization & Normal Forms (1NF, 2NF, 3NF, BCNF) & Anomalies", priorityRank: 1, difficulty: "hard", estimatedHours: 4 },
      { title: "Transactions & ACID Properties, Concurrency Schedules & 2PL", priorityRank: 1, difficulty: "hard", estimatedHours: 4 },
      { title: "SQL Complex Queries: Joins, Correlated Subqueries, Windows", priorityRank: 1, difficulty: "medium", estimatedHours: 3 },
      { title: "Database Indexing: B-Trees, B+ Trees & Query Optimization", priorityRank: 1, difficulty: "hard", estimatedHours: 3.5 },
      { title: "Entity Relationship (ER) Diagrams & Relational Mapping", priorityRank: 2, difficulty: "easy", estimatedHours: 2 },
      { title: "Recovery System: Log-Based Recovery & Checkpoints", priorityRank: 2, difficulty: "medium", estimatedHours: 2.5 },
      { title: "NoSQL Databases vs Relational & CAP Theorem Overview", priorityRank: 3, difficulty: "medium", estimatedHours: 2 },
    ],
  },
];

export function ExamPlannerWorkspace() {
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [examError, setExamError] = useState("");
  const [topicError, setTopicError] = useState("");
  const [isImportingPreset, setIsImportingPreset] = useState(false);

  // New Exam Form
  const [examForm, setExamForm] = useState({
    title: "",
    examDate: "",
    targetScore: "",
    priority: "high",
    description: "",
  });

  // New Topic Form
  const [topicForm, setTopicForm] = useState({
    subjectName: "Computer Networks",
    title: "",
    difficulty: "medium",
    priority: "high",
    priorityRank: 1,
    estimatedHours: 3,
  });

  const { data: exams = [], isLoading: isLoadingExams } = useTargetExams();
  const createExamMutation = useCreateTargetExam();
  const deleteExamMutation = useDeleteTargetExam();

  // Pick active exam: selected exam or first available
  const activeExamId = selectedExamId || exams[0]?._id;
  const activeExam = exams.find((e) => e._id === activeExamId) || exams[0];

  const { data: topics = [], isLoading: isLoadingTopics } = useTargetTopics({ examId: activeExamId });
  const createTopicMutation = useCreateTargetTopic();
  const updateTopicMutation = useUpdateTargetTopic();
  const deleteTopicMutation = useDeleteTargetTopic();

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examForm.title.trim() || !examForm.examDate) return;
    setExamError("");

    try {
      const created = await createExamMutation.mutateAsync({
        ...examForm,
        title: examForm.title.trim(),
        name: examForm.title.trim(),
      });
      if (created?.data?._id) {
        setSelectedExamId(created.data._id);
      }
      setIsExamModalOpen(false);
      setExamForm({
        title: "",
        examDate: "",
        targetScore: "",
        priority: "high",
        description: "",
      });
    } catch (err) {
      console.error("Failed to create exam:", err);
      setExamError(err?.response?.data?.message || err?.message || "Failed to create exam. Please check input values.");
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.title.trim()) {
      setTopicError("Please enter a topic title.");
      return;
    }
    if (!activeExamId) {
      setTopicError("Please create or select an exam first before adding topics.");
      return;
    }
    setTopicError("");

    try {
      const rank = Number(topicForm.priorityRank) || 1;
      const priorityLabel = rank === 1 ? "high" : rank === 2 ? "medium" : "low";

      await createTopicMutation.mutateAsync({
        examId: activeExamId,
        subjectName: topicForm.subjectName.trim() || "Computer Networks",
        title: topicForm.title.trim(),
        name: topicForm.title.trim(),
        priorityRank: rank,
        priority: priorityLabel,
        difficulty: (topicForm.difficulty || "medium").toLowerCase(),
        estimatedHours: parseFloat(topicForm.estimatedHours) || 2,
      });

      setIsTopicModalOpen(false);
      setTopicForm((prev) => ({
        ...prev,
        title: "",
        difficulty: "medium",
        priorityRank: 1,
        priority: "high",
        estimatedHours: 3,
      }));
    } catch (err) {
      console.error("Failed to create topic:", err);
      setTopicError(err?.response?.data?.message || err?.message || "Failed to add topic. Please check input values.");
    }
  };

  const handleUpdateTopicStatus = (topicId, nextStatus) => {
    updateTopicMutation.mutate({
      id: topicId,
      data: { status: nextStatus },
    });
  };

  const handleUpdateTopicPriority = (topicId, rank) => {
    const priorityLabel = rank === 1 ? "high" : rank === 2 ? "medium" : "low";
    updateTopicMutation.mutate({
      id: topicId,
      data: {
        priorityRank: rank,
        priority: priorityLabel,
      },
    });
  };

  const handleImportPreset = async (preset) => {
    if (!activeExamId) {
      alert("Please select or add an exam first.");
      return;
    }
    setIsImportingPreset(true);
    try {
      for (const item of preset.topics) {
        await createTopicMutation.mutateAsync({
          examId: activeExamId,
          subjectName: preset.subjectName,
          title: item.title,
          name: item.title,
          priorityRank: item.priorityRank,
          priority: item.priorityRank === 1 ? "high" : item.priorityRank === 2 ? "medium" : "low",
          difficulty: item.difficulty,
          estimatedHours: item.estimatedHours,
        });
      }
    } catch (err) {
      console.error("Failed to load preset syllabus:", err);
    } finally {
      setIsImportingPreset(false);
    }
  };

  const openAddTopicModal = (subject = "Computer Networks", rank = 1) => {
    setTopicForm({
      subjectName: subject,
      title: "",
      difficulty: "medium",
      priorityRank: rank,
      priority: rank === 1 ? "high" : rank === 2 ? "medium" : "low",
      estimatedHours: 3,
    });
    setTopicError("");
    setIsTopicModalOpen(true);
  };

  // Group topics by subject
  const subjectsMap = {};
  for (const t of topics) {
    const sub = t.subjectName || "Core Syllabus";
    if (!subjectsMap[sub]) subjectsMap[sub] = [];
    subjectsMap[sub].push(t);
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <GraduationCap size={13} />
            <span>Target Exam & Prioritized Syllabus Hub</span>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--ink)]">
            High-Stakes Exam Preparation
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Break syllabi down by subject and organize topics by 1st, 2nd, and 3rd Priority so you always conquer high-weightage topics first.
          </p>
        </div>

        <Button
          onClick={() => {
            setExamError("");
            setIsExamModalOpen(true);
          }}
          className="rounded-2xl text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Add New Exam</span>
        </Button>
      </div>

      {/* 2. Exams Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {isLoadingExams ? (
          <div className="col-span-3 p-8 text-center text-xs text-[var(--ink-muted)]">
            Loading scheduled exams...
          </div>
        ) : exams.length === 0 ? (
          <div className="col-span-3 p-8 text-center rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--border)] space-y-3">
            <GraduationCap size={36} className="mx-auto text-[var(--ink-muted)] opacity-50" />
            <div className="text-sm font-bold text-[var(--ink)]">No exams scheduled yet</div>
            <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto">
              Add your target competitive, placement, or semester exam (e.g. TCS, GATE, AWS, Campus Placements) to begin organizing prioritized syllabi.
            </p>
            <Button
              onClick={() => setIsExamModalOpen(true)}
              className="rounded-2xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Plus size={13} className="mr-1" />
              Add Target Exam
            </Button>
          </div>
        ) : (
          exams.map((exam) => {
            const isSelected = exam._id === activeExamId;
            const diffDays = Math.max(0, Math.ceil((new Date(exam.examDate) - new Date()) / (1000 * 60 * 60 * 24)));

            return (
              <div
                key={exam._id}
                onClick={() => setSelectedExamId(exam._id)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-blue-500/10 border-blue-500/50 shadow-md ring-1 ring-blue-500/30"
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-blue-500/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--ink)]">{exam.title || exam.name}</h3>
                    <div className="text-[11px] text-[var(--ink-muted)] flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(exam.examDate).toLocaleDateString()}
                      </span>
                      {exam.targetScore && (
                        <span className="text-purple-500 font-semibold">Goal: {exam.targetScore}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-display font-black text-blue-500">
                      {diffDays}d
                    </span>
                    <div className="text-[9px] uppercase font-bold text-[var(--ink-muted)]">remaining</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                  <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                    {exam.priority} Priority
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteExamMutation.mutate(exam._id);
                    }}
                    className="text-[var(--ink-muted)] hover:text-red-500 p-1 rounded-lg"
                    title="Delete Exam"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Active Exam Syllabus Topics */}
      {activeExam && (
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <div className="text-xs font-semibold text-blue-500 flex items-center gap-1.5">
                <BookOpen size={13} />
                <span>Active Syllabus Breakdown</span>
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--ink)]">
                {activeExam.title || activeExam.name} — Prioritized Topic Lists
              </h3>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Organized by subject (e.g. Computer Networks) with topics sorted by 1st Priority, 2nd Priority, and 3rd Priority.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => openAddTopicModal("Computer Networks", 1)}
                className="rounded-2xl text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Add Syllabus Topic</span>
              </Button>
            </div>
          </div>

          {/* Quick Syllabus Starter Presets */}
          {topics.length === 0 && (
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Sparkles size={14} />
                  <span>One-Click Starter Syllabi (Includes 1st, 2nd & 3rd Priority Topics)</span>
                </div>
                {isImportingPreset && (
                  <span className="text-xs text-blue-400 font-semibold animate-pulse">
                    Importing topics...
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                Click any standard subject below to automatically create a complete syllabus with topics prioritized by weightage:
              </p>
              <div className="flex flex-wrap gap-2">
                {SYLLABUS_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    disabled={isImportingPreset}
                    onClick={() => handleImportPreset(preset)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-2)] hover:bg-blue-600 hover:text-white border border-[var(--border)] text-[var(--ink)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap size={12} className="text-amber-400" />
                    <span>Load {preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topics Breakdown by Subject */}
          {topics.length === 0 ? (
            <div className="p-10 text-center text-xs text-[var(--ink-muted)] border border-dashed border-[var(--border)] rounded-3xl space-y-3">
              <Layers size={32} className="mx-auto text-[var(--ink-muted)] opacity-40" />
              <div className="text-sm font-bold text-[var(--ink)]">No syllabus topics added yet</div>
              <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto">
                Add a subject like <strong>Computer Networks (CN)</strong> and organize its topics by 1st priority, 2nd priority, and 3rd priority.
              </p>
              <Button
                onClick={() => openAddTopicModal("Computer Networks", 1)}
                className="rounded-2xl text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                <Plus size={13} className="mr-1" />
                Add Your First Topic
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(subjectsMap).map(([subject, subTopics]) => {
                const completedCount = subTopics.filter((t) => t.status === "mastered" || t.status === "completed").length;
                const totalCount = subTopics.length;
                const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                // Segment by Priority Rank: 1 = 1st, 2 = 2nd, 3 = 3rd
                const p1Topics = subTopics.filter(
                  (t) => t.priorityRank === 1 || t.priority === "high" || t.priority === "must_know" || t.priority === "critical"
                );
                const p2Topics = subTopics.filter(
                  (t) => (t.priorityRank === 2 || t.priority === "medium") && t.priorityRank !== 1
                );
                const p3Topics = subTopics.filter(
                  (t) => (t.priorityRank === 3 || t.priority === "low") && t.priorityRank !== 1 && t.priorityRank !== 2
                );

                return (
                  <div
                    key={subject}
                    className="p-5 rounded-3xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-5"
                  >
                    {/* Subject Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base text-[var(--ink)]">{subject}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                              {completedCount} / {totalCount} Mastered ({completionPct}%)
                            </span>
                          </div>
                          <div className="w-48 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden mt-1.5 border border-[var(--border)]">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAddTopicModal(subject, 1)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Add Topic to {subject}</span>
                        </button>
                      </div>
                    </div>

                    {/* Prioritized Topics Lists */}
                    <div className="space-y-4">
                      {/* --- 1ST PRIORITY --- */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                            <span>🔥</span>
                            <span>1st Priority Topics (Must-Know & Core)</span>
                            <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                              ({p1Topics.length})
                            </span>
                          </div>
                          <button
                            onClick={() => openAddTopicModal(subject, 1)}
                            className="text-[11px] text-rose-400 hover:underline font-semibold flex items-center gap-1"
                          >
                            <Plus size={11} /> Add 1st Priority
                          </button>
                        </div>

                        {p1Topics.length === 0 ? (
                          <div className="p-3 rounded-2xl bg-[var(--surface)]/50 border border-dashed border-rose-500/20 text-center text-xs text-[var(--ink-muted)]">
                            No 1st priority topics yet. Add must-know topics for {subject}.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {p1Topics.map((topic) => (
                              <TopicCard
                                key={topic._id}
                                topic={topic}
                                currentRank={1}
                                onUpdateStatus={handleUpdateTopicStatus}
                                onUpdatePriority={handleUpdateTopicPriority}
                                onDelete={(id) => deleteTopicMutation.mutate(id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* --- 2ND PRIORITY --- */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                            <span>⚡</span>
                            <span>2nd Priority Topics (Important & Secondary)</span>
                            <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                              ({p2Topics.length})
                            </span>
                          </div>
                          <button
                            onClick={() => openAddTopicModal(subject, 2)}
                            className="text-[11px] text-amber-400 hover:underline font-semibold flex items-center gap-1"
                          >
                            <Plus size={11} /> Add 2nd Priority
                          </button>
                        </div>

                        {p2Topics.length === 0 ? (
                          <div className="p-3 rounded-2xl bg-[var(--surface)]/50 border border-dashed border-amber-500/20 text-center text-xs text-[var(--ink-muted)]">
                            No 2nd priority topics yet. Add high-yield secondary topics.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {p2Topics.map((topic) => (
                              <TopicCard
                                key={topic._id}
                                topic={topic}
                                currentRank={2}
                                onUpdateStatus={handleUpdateTopicStatus}
                                onUpdatePriority={handleUpdateTopicPriority}
                                onDelete={(id) => deleteTopicMutation.mutate(id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* --- 3RD PRIORITY --- */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                            <span>📘</span>
                            <span>3rd Priority Topics (Supplementary & Foundation)</span>
                            <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                              ({p3Topics.length})
                            </span>
                          </div>
                          <button
                            onClick={() => openAddTopicModal(subject, 3)}
                            className="text-[11px] text-blue-400 hover:underline font-semibold flex items-center gap-1"
                          >
                            <Plus size={11} /> Add 3rd Priority
                          </button>
                        </div>

                        {p3Topics.length === 0 ? (
                          <div className="p-3 rounded-2xl bg-[var(--surface)]/50 border border-dashed border-blue-500/20 text-center text-xs text-[var(--ink-muted)]">
                            No 3rd priority topics yet. Add supplementary topics.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {p3Topics.map((topic) => (
                              <TopicCard
                                key={topic._id}
                                topic={topic}
                                currentRank={3}
                                onUpdateStatus={handleUpdateTopicStatus}
                                onUpdatePriority={handleUpdateTopicPriority}
                                onDelete={(id) => deleteTopicMutation.mutate(id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Add Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--ink)]">Add Target Exam</h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)]"
              >
                <X size={16} />
              </button>
            </div>

            {examError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{examError}</span>
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCS Digital, GATE CS, AWS Certified Solutions Architect"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Target Score / Rank</label>
                  <input
                    type="text"
                    placeholder="e.g. 850+ or Top 1%"
                    value={examForm.targetScore}
                    onChange={(e) => setExamForm({ ...examForm, targetScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Priority</label>
                <select
                  value={examForm.priority}
                  onChange={(e) => setExamForm({ ...examForm, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExamMutation.isPending}
                  className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  {createExamMutation.isPending ? "Creating Exam..." : "Create Exam"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. Add Topic Modal with Priority Tiering */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">Add Syllabus Topic</h3>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Assign to a subject and prioritize as 1st, 2nd, or 3rd Priority.
                </p>
              </div>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)]"
              >
                <X size={16} />
              </button>
            </div>

            {topicError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{topicError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTopic} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Networks (CN), Operating Systems, DBMS"
                  value={topicForm.subjectName}
                  onChange={(e) => setTopicForm({ ...topicForm, subjectName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCP/IP Protocol Suite & 3-Way Handshake"
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                />
              </div>

              {/* Priority Tier Selection */}
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1.5">
                  Priority Rank (Study Order) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_LEVELS.map((tier) => {
                    const isSelected = Number(topicForm.priorityRank) === tier.rank;
                    return (
                      <button
                        type="button"
                        key={tier.rank}
                        onClick={() =>
                          setTopicForm({
                            ...topicForm,
                            priorityRank: tier.rank,
                            priority: tier.priority,
                          })
                        }
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? `${tier.badge} ring-1 ring-current font-bold`
                            : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--ink-muted)]"
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1">
                          <span>{tier.icon}</span>
                          <span>{tier.shortLabel}</span>
                        </div>
                        <div className="text-[10px] opacity-75 mt-0.5 leading-tight line-clamp-1">
                          {tier.rank === 1 ? "Must-Know" : tier.rank === 2 ? "Important" : "Optional"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Difficulty</label>
                  <select
                    value={topicForm.difficulty}
                    onChange={(e) => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={topicForm.estimatedHours}
                    onChange={(e) => setTopicForm({ ...topicForm, estimatedHours: parseFloat(e.target.value) || 2 })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTopicMutation.isPending}
                  className="rounded-xl text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer"
                >
                  {createTopicMutation.isPending ? "Adding Topic..." : "Add Topic"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Individual Prioritized Topic Card
function TopicCard({ topic, currentRank, onUpdateStatus, onUpdatePriority, onDelete }) {
  const statusObj = STATUS_OPTIONS.find((s) => s.id === topic.status) || STATUS_OPTIONS[0];

  return (
    <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--ink-muted)]/30 transition-all flex flex-col justify-between gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="text-xs font-bold text-[var(--ink)] leading-snug">{topic.title || topic.name}</div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--ink-muted)]">
            <span className="uppercase font-semibold">{topic.difficulty || "medium"}</span>
            <span>•</span>
            <span>{topic.estimatedHours || 2}h est</span>
          </div>
        </div>

        {/* Inline Priority Selector */}
        <select
          value={topic.priorityRank || currentRank}
          onChange={(e) => onUpdatePriority(topic._id, Number(e.target.value))}
          className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-[var(--surface-2)] text-[var(--ink)] cursor-pointer focus:outline-none"
          title="Change Topic Priority Rank"
        >
          <option value={1}>🔥 1st Priority</option>
          <option value={2}>⚡ 2nd Priority</option>
          <option value={3}>📘 3rd Priority</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/60">
        <select
          value={topic.status}
          onChange={(e) => onUpdateStatus(topic._id, e.target.value)}
          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none ${statusObj.color}`}
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st.id} value={st.id}>
              {st.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => onDelete(topic._id)}
          className="text-[var(--ink-muted)] hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
          title="Delete Topic"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
