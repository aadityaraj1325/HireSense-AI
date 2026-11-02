const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const targetService = require("../services/targetService");
const { askTargetCoach } = require("../services/aiTargetCoachService");
const studyDocsService = require("../services/studyDocsService");

const router = express.Router();

router.use(requireAuth);

/* ==========================================================================
   1. DASHBOARD & OVERVIEW
   ========================================================================== */
router.get(
    "/dashboard",
    asyncHandler(async (req, res) => {
        const metrics = await targetService.getDashboardMetrics(req.user._id);
        res.json({
            success: true,
            data: metrics,
        });
    })
);

router.get(
    "/reality-score",
    asyncHandler(async (req, res) => {
        const reality = await targetService.getGoalRealityScore(req.user._id);
        res.json({
            success: true,
            data: reality,
        });
    })
);

router.get(
    "/analytics",
    asyncHandler(async (req, res) => {
        const analytics = await targetService.getProductivityAnalytics(req.user._id);
        res.json({
            success: true,
            data: analytics,
        });
    })
);

/* ==========================================================================
   2. DAILY PLANNING & TASKS
   ========================================================================== */
const taskCreateSchema = z.object({
    title: z.string().trim().min(1, "Task title is required").max(200),
    description: z.string().trim().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    category: z.enum([
        "college",
        "exam_prep",
        "coding",
        "dsa",
        "project",
        "placement",
        "personal",
        "health",
        "other",
    ]).default("coding"),
    expectedMinutes: z.number().int().min(1).max(1440).default(60),
    actualMinutes: z.number().int().min(0).max(1440).default(0),
    subtasks: z.array(z.object({
        id: z.string().optional(),
        title: z.string().trim().min(1),
        completed: z.boolean().default(false),
    })).optional(),
});

const taskUpdateSchema = taskCreateSchema.partial().extend({
    status: z.enum(["pending", "in_progress", "completed", "rescheduled", "cancelled"]).optional(),
});

router.get(
    "/tasks",
    asyncHandler(async (req, res) => {
        const { date } = req.query;
        const tasks = await targetService.getTasks(req.user._id, date);
        res.json({
            success: true,
            data: tasks,
        });
    })
);

router.post(
    "/tasks",
    validate(taskCreateSchema),
    asyncHandler(async (req, res) => {
        const task = await targetService.createTask(req.user._id, req.body);
        res.status(201).json({
            success: true,
            data: task,
        });
    })
);

router.patch(
    "/tasks/:id",
    validate(taskUpdateSchema),
    asyncHandler(async (req, res) => {
        const task = await targetService.updateTask(req.user._id, req.params.id, req.body);
        if (!task) {
            throw ApiError.notFound("Task not found");
        }
        res.json({
            success: true,
            data: task,
        });
    })
);

router.delete(
    "/tasks/:id",
    asyncHandler(async (req, res) => {
        const result = await targetService.deleteTask(req.user._id, req.params.id);
        if (!result) {
            throw ApiError.notFound("Task not found");
        }
        res.json({
            success: true,
            message: "Task deleted successfully",
        });
    })
);

router.post(
    "/tasks/:id/reschedule",
    validate(z.object({ newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })),
    asyncHandler(async (req, res) => {
        const task = await targetService.rescheduleTask(req.user._id, req.params.id, req.body.newDate);
        if (!task) {
            throw ApiError.notFound("Task not found");
        }
        res.json({
            success: true,
            data: task,
        });
    })
);

/* ==========================================================================
   3. ROUTINE BUILDER ("MY ROUTINE")
   ========================================================================== */
const routineSchema = z.object({
    title: z.string().trim().min(1, "Routine title is required").max(100),
    startTime: z.string().trim().min(1, "Start time is required"),
    endTime: z.string().trim().min(1, "End time is required"),
    category: z.enum([
        "morning_routine",
        "study_block",
        "coding_session",
        "college_work",
        "revision_slot",
        "workout",
        "night_review",
        "break",
        "other",
    ]).default("study_block"),
    recurringType: z.enum(["all_days", "weekdays", "weekends"]).default("all_days"),
    notificationAlert: z.boolean().default(false),
    notes: z.string().trim().optional(),
});

router.get(
    "/routines",
    asyncHandler(async (req, res) => {
        const routines = await targetService.getRoutines(req.user._id);
        res.json({
            success: true,
            data: routines,
        });
    })
);

router.post(
    "/routines",
    validate(routineSchema),
    asyncHandler(async (req, res) => {
        const routine = await targetService.createRoutine(req.user._id, req.body);
        res.status(201).json({
            success: true,
            data: routine,
        });
    })
);

router.patch(
    "/routines/:id",
    validate(routineSchema.partial().extend({ isActive: z.boolean().optional() })),
    asyncHandler(async (req, res) => {
        const routine = await targetService.updateRoutine(req.user._id, req.params.id, req.body);
        if (!routine) {
            throw ApiError.notFound("Routine block not found");
        }
        res.json({
            success: true,
            data: routine,
        });
    })
);

router.delete(
    "/routines/:id",
    asyncHandler(async (req, res) => {
        const result = await targetService.deleteRoutine(req.user._id, req.params.id);
        if (!result) {
            throw ApiError.notFound("Routine block not found");
        }
        res.json({
            success: true,
            message: "Routine deleted successfully",
        });
    })
);

router.post(
    "/routines/:id/toggle",
    validate(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })),
    asyncHandler(async (req, res) => {
        const dateStr = req.body.date || new Date().toISOString().slice(0, 10);
        const routine = await targetService.toggleRoutineCompletion(req.user._id, req.params.id, dateStr);
        if (!routine) {
            throw ApiError.notFound("Routine block not found");
        }
        res.json({
            success: true,
            data: routine,
        });
    })
);

/* ==========================================================================
   4. EXAM PREPARATION & SYLLABUS TRACKER
   ========================================================================== */
const examSchema = z.object({
    title: z.string().trim().min(1, "Exam title is required").max(150),
    examDate: z.string().or(z.date()),
    description: z.string().trim().optional(),
    targetScore: z.string().trim().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("high"),
    subjects: z.array(z.object({
        name: z.string().trim().min(1),
        targetHours: z.number().default(20),
        weightage: z.string().optional(),
    })).optional(),
});

router.get(
    "/exams",
    asyncHandler(async (req, res) => {
        const exams = await targetService.getExams(req.user._id);
        res.json({
            success: true,
            data: exams,
        });
    })
);

router.post(
    "/exams",
    validate(examSchema),
    asyncHandler(async (req, res) => {
        const exam = await targetService.createExam(req.user._id, req.body);
        res.status(201).json({
            success: true,
            data: exam,
        });
    })
);

router.patch(
    "/exams/:id",
    validate(examSchema.partial()),
    asyncHandler(async (req, res) => {
        const exam = await targetService.updateExam(req.user._id, req.params.id, req.body);
        if (!exam) {
            throw ApiError.notFound("Exam not found");
        }
        res.json({
            success: true,
            data: exam,
        });
    })
);

router.delete(
    "/exams/:id",
    asyncHandler(async (req, res) => {
        const result = await targetService.deleteExam(req.user._id, req.params.id);
        if (!result) {
            throw ApiError.notFound("Exam not found");
        }
        res.json({
            success: true,
            message: "Exam deleted successfully",
        });
    })
);

/* ==========================================================================
   5. SYLLABUS TOPICS
   ========================================================================== */
const topicSchema = z.object({
    examId: z.string().min(1, "Associated Exam is required"),
    subjectName: z.string().trim().min(1, "Subject name is required"),
    subjectId: z.string().optional(),
    title: z.string().trim().min(1, "Topic title is required").max(300),
    name: z.string().trim().optional(),
    difficulty: z.string().optional().default("medium"),
    priority: z.string().optional().default("high"),
    priorityRank: z.union([z.number(), z.string().transform((v) => parseInt(v, 10))]).optional().default(1),
    status: z.enum(["not_started", "learning", "completed", "needs_revision", "mastered"]).optional().default("not_started"),
    estimatedHours: z.union([z.number(), z.string().transform((v) => parseFloat(v))]).optional().default(2),
    actualHoursSpent: z.union([z.number(), z.string().transform((v) => parseFloat(v))]).optional().default(0),
    actualHours: z.union([z.number(), z.string().transform((v) => parseFloat(v))]).optional().default(0),
    confidenceRating: z.union([z.number(), z.string()]).optional().default(3),
    notesSummary: z.string().trim().optional(),
    notes: z.string().trim().optional(),
});

router.get(
    "/topics",
    asyncHandler(async (req, res) => {
        const { examId, subjectName } = req.query;
        const topics = await targetService.getTopics(req.user._id, examId, subjectName);
        res.json({
            success: true,
            data: topics,
        });
    })
);

router.post(
    "/topics",
    validate(topicSchema),
    asyncHandler(async (req, res) => {
        const topic = await targetService.createTopic(req.user._id, req.body);
        res.status(201).json({
            success: true,
            data: topic,
        });
    })
);

router.patch(
    "/topics/:id",
    validate(topicSchema.partial()),
    asyncHandler(async (req, res) => {
        const topic = await targetService.updateTopic(req.user._id, req.params.id, req.body);
        if (!topic) {
            throw ApiError.notFound("Topic not found");
        }
        res.json({
            success: true,
            data: topic,
        });
    })
);

router.delete(
    "/topics/:id",
    asyncHandler(async (req, res) => {
        const result = await targetService.deleteTopic(req.user._id, req.params.id);
        if (!result) {
            throw ApiError.notFound("Topic not found");
        }
        res.json({
            success: true,
            message: "Topic deleted successfully",
        });
    })
);

/* ==========================================================================
   6. SMART REVISION SYSTEM (SPACED REPETITION)
   ========================================================================== */
router.get(
    "/revisions",
    asyncHandler(async (req, res) => {
        const revisions = await targetService.getDueRevisions(req.user._id);
        res.json({
            success: true,
            data: revisions,
        });
    })
);

router.post(
    "/revisions/:id/complete",
    validate(z.object({
        confidenceRating: z.enum(["forgot", "difficult", "moderate", "easy", "mastered"]),
        notes: z.string().trim().optional(),
    })),
    asyncHandler(async (req, res) => {
        const topic = await targetService.logRevision(
            req.user._id,
            req.params.id,
            req.body.confidenceRating,
            req.body.notes
        );
        if (!topic) {
            throw ApiError.notFound("Topic not found for revision");
        }
        res.json({
            success: true,
            data: topic,
        });
    })
);

/* ==========================================================================
   7. DOCUMENT-LIKE RICH TEXT NOTES EDITOR & LEARNING WORKSPACE
   ========================================================================== */
const noteSchema = z.object({
    title: z.string().trim().min(1, "Note title is required").max(300),
    content: z.string().default(""),
    folder: z.string().trim().default("General"),
    tags: z.array(z.string().trim()).default([]),
    isPinned: z.boolean().default(false),
    color: z.string().default("#3b82f6"),
    attachedTo: z.object({
        type: z.enum(["none", "exam", "topic", "task", "general"]).default("general"),
        id: z.string().optional().default(""),
        name: z.string().optional().default(""),
    }).optional(),
    highlights: z.array(z.any()).optional(),
    doubts: z.array(z.any()).optional(),
    flashcards: z.array(z.any()).optional(),
    versions: z.array(z.any()).optional(),
    connections: z.array(z.any()).optional(),
    learningSessions: z.array(z.any()).optional(),
    wordCount: z.number().optional(),
}).passthrough();

// 1. AI Explain Selection
router.post(
    "/notes/ai/explain",
    asyncHandler(async (req, res) => {
        const { selectedText, contextTitle, level } = req.body;
        const result = await studyDocsService.explainSelection(req.user._id, { selectedText, contextTitle, level });
        res.json({
            success: true,
            data: result,
        });
    })
);

// 2. AI Note Transformation
router.post(
    "/notes/ai/transform",
    asyncHandler(async (req, res) => {
        const { text, transformType, title } = req.body;
        const result = await studyDocsService.transformNote(req.user._id, { text, transformType, title });
        res.json({
            success: true,
            data: result,
        });
    })
);

// 3. AI Code Workspace Analysis
router.post(
    "/notes/ai/code-analysis",
    asyncHandler(async (req, res) => {
        const { code, language, action, targetLanguage } = req.body;
        const result = await studyDocsService.analyzeCode(req.user._id, { code, language, action, targetLanguage });
        res.json({
            success: true,
            data: result,
        });
    })
);

// 4. Living Knowledge Graph
router.get(
    "/notes/graph",
    asyncHandler(async (req, res) => {
        const result = await studyDocsService.getKnowledgeGraph(req.user._id);
        res.json({
            success: true,
            data: result,
        });
    })
);

// 5. Learning DNA Analytics
router.get(
    "/notes/analytics/dna",
    asyncHandler(async (req, res) => {
        const result = await studyDocsService.getLearningDNA(req.user._id);
        res.json({
            success: true,
            data: result,
        });
    })
);

// 6. Convert Doubt to Revision Task
router.post(
    "/notes/doubts/create-task",
    asyncHandler(async (req, res) => {
        const { text, title, docTitle, docId } = req.body;
        const todayStr = new Date().toISOString().split("T")[0];
        const task = await targetService.createTask(req.user._id, {
            title: `Resolve Doubt: ${title || (text || "Topic").slice(0, 40)}`,
            description: `From document "${docTitle || "Study Notes"}":\n"${text}"\n\nReview this concept and resolve doubt in Study Docs.`,
            category: "exam_preparation",
            priority: "high",
            date: todayStr,
            expectedMinutes: 30,
        });
        res.json({
            success: true,
            data: task,
        });
    })
);

router.get(
    "/notes",
    asyncHandler(async (req, res) => {
        const { folder, tag, search } = req.query;
        const notes = await targetService.getNotes(req.user._id, { folder, tag, search });
        res.json({
            success: true,
            data: notes,
        });
    })
);

router.post(
    "/notes",
    validate(noteSchema),
    asyncHandler(async (req, res) => {
        const note = await targetService.createNote(req.user._id, req.body);
        res.status(201).json({
            success: true,
            data: note,
        });
    })
);

router.patch(
    "/notes/:id",
    validate(noteSchema.partial()),
    asyncHandler(async (req, res) => {
        const note = await targetService.updateNote(req.user._id, req.params.id, req.body);
        if (!note) {
            throw ApiError.notFound("Note not found");
        }
        res.json({
            success: true,
            data: note,
        });
    })
);

router.delete(
    "/notes/:id",
    asyncHandler(async (req, res) => {
        const result = await targetService.deleteNote(req.user._id, req.params.id);
        if (!result) {
            throw ApiError.notFound("Note not found");
        }
        res.json({
            success: true,
            message: "Note deleted successfully",
        });
    })
);

/* ==========================================================================
   8. DAILY JOURNAL ("WHAT DID I DO TODAY?")
   ========================================================================== */
router.get(
    "/journal/:date",
    asyncHandler(async (req, res) => {
        const journal = await targetService.getDailyJournal(req.user._id, req.params.date);
        res.json({
            success: true,
            data: journal,
        });
    })
);

router.post(
    "/journal",
    validate(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reflection: z.object({
            whatWentWell: z.string().trim().optional(),
            whatDistracted: z.string().trim().optional(),
            tomorrowPriority: z.string().trim().optional(),
            notes: z.string().trim().optional(),
        }).optional(),
        mood: z.enum(["exhausted", "low", "neutral", "good", "energized"]).default("good"),
        productivityRating: z.number().int().min(1).max(10).default(7),
    })),
    asyncHandler(async (req, res) => {
        const journal = await targetService.saveDailyJournal(req.user._id, req.body.date, req.body);
        res.json({
            success: true,
            data: journal,
        });
    })
);

/* ==========================================================================
   9. INTERACTIVE CALENDAR
   ========================================================================== */
router.get(
    "/calendar",
    asyncHandler(async (req, res) => {
        const now = new Date();
        const year = parseInt(req.query.year, 10) || now.getFullYear();
        const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
        const calendar = await targetService.getCalendarMonth(req.user._id, year, month);
        res.json({
            success: true,
            data: calendar,
        });
    })
);

/* ==========================================================================
   10. GROWTH MILESTONES & ACHIEVEMENTS
   ========================================================================== */
router.get(
    "/achievements",
    asyncHandler(async (req, res) => {
        const achievements = await targetService.getAchievements(req.user._id);
        res.json({
            success: true,
            data: achievements,
        });
    })
);

/* ==========================================================================
   11. GOAL RECOVERY ENGINE
   ========================================================================== */
router.get(
    "/recovery",
    asyncHandler(async (req, res) => {
        const recovery = await targetService.getGoalRecoveryPlan(req.user._id);
        res.json({
            success: true,
            data: recovery,
        });
    })
);

router.post(
    "/recovery/action",
    validate(z.object({
        action: z.enum(["reschedule_smart", "dismiss_all"]),
        targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    })),
    asyncHandler(async (req, res) => {
        const result = await targetService.applyRecoveryAction(
            req.user._id,
            req.body.action,
            req.body.targetDate
        );
        res.json({
            success: true,
            data: result,
        });
    })
);

/* ==========================================================================
   12. AI TARGET COACH
   ========================================================================== */
router.post(
    "/coach",
    validate(z.object({
        message: z.string().trim().min(1, "Question or message is required"),
        conversationHistory: z.array(z.object({
            role: z.enum(["user", "assistant", "coach"]),
            text: z.string().optional(),
            content: z.string().optional(),
        })).optional(),
    })),
    asyncHandler(async (req, res) => {
        const coachingResult = await askTargetCoach(
            req.user._id,
            req.body.message,
            req.body.conversationHistory
        );
        res.json({
            success: true,
            data: coachingResult,
        });
    })
);

module.exports = router;

