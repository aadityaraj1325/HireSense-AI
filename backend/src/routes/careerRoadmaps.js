const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const CareerRoadmap = require("../models/CareerRoadmap");
const LearningNote = require("../models/LearningNote");
const MentorConversation = require("../models/MentorConversation");
const {
    topicSchema, followUpSchema, bookmarkSchema, saveNoteSchema,
    generateExplanation, answerFollowUp,
} = require("../services/mentorWorkspaceService");
const {
    generateSchema, progressSchema, assessmentSchema, adaptSchema, mentorSchema,
    generateRoadmap, readinessFor, mentorAnswer, learningNoteSchema,
    learningNoteUpdateSchema, calendarQuerySchema, aggregateCalendarActivity,
} = require("../services/careerRoadmapService");

const router = express.Router();
router.use(requireAuth);
const idParam = z.object({ id: z.string().refine(mongoose.isValidObjectId, "Invalid id") });
const conversationParam = z.object({
    id: z.string().refine(mongoose.isValidObjectId, "Invalid roadmap id"),
    conversationId: z.string().refine(mongoose.isValidObjectId, "Invalid conversation id"),
});

async function loadRoadmap(req) {
    const roadmap = await CareerRoadmap.findOne({
        userId: req.user._id,
        $or: [{ _id: req.params.id }, { resumeId: req.params.id }],
    }).sort({ roadmapVersion: -1 });
    if (!roadmap) throw ApiError.notFound("Career roadmap not found");
    return roadmap;
}

async function loadResume(userId, resumeId, versionId) {
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw ApiError.notFound("Resume not found");
    const version = await ResumeVersion.findOne({ _id: versionId || resume.currentVersionId, resumeId: resume._id });
    if (!version) throw ApiError.badRequest("Resume has no usable version");
    return { resume, version };
}

router.post("/generate", validate(generateSchema), asyncHandler(async (req, res) => {
    const generationId = `roadmap-${Date.now()}-${String(req.user._id).slice(-6)}`;
    const { resume, version } = await loadResume(req.user._id, req.body.resumeId, req.body.versionId);
    const latest = await CareerRoadmap.findOne({ userId: req.user._id, resumeId: resume._id }).sort({ roadmapVersion: -1 }).select("roadmapVersion").lean();
    const existing = await CareerRoadmap.findOne({
        userId: req.user._id,
        resumeId: resume._id,
        versionId: version._id,
        "targetJob.title": req.body.targetJob.title,
        "targetJob.description": req.body.targetJob.description || undefined,
    }).sort({ roadmapVersion: -1 });
    if (existing && !req.body.force) {
        return res.status(200).json({ roadmap: existing, created: false });
    }
    const generated = await generateRoadmap({
        resumeText: version.rawText,
        targetJob: req.body.targetJob,
    }, { generationId });
    const roadmap = await CareerRoadmap.create({
        userId: req.user._id, resumeId: resume._id, versionId: version._id,
        roadmapVersion: (latest?.roadmapVersion || 0) + 1,
        targetJob: req.body.targetJob, ...generated,
        progress: { totalTasks: generated.dailyTasks.length },
    });
    res.status(201).json({ roadmap, created: true });
}));

router.get("/", asyncHandler(async (req, res) => {
    const roadmaps = await CareerRoadmap.find({ userId: req.user._id })
        .select("-dailyTasks -resources -assessments").sort({ updatedAt: -1 }).lean();
    res.json({ roadmaps });
}));

router.get("/by-resume/:resumeId", validate(z.object({ resumeId: z.string().refine(mongoose.isValidObjectId, "Invalid id") }), "params"), asyncHandler(async (req, res) => {
    const roadmap = await CareerRoadmap.findOne({
        userId: req.user._id,
        resumeId: req.params.resumeId,
    }).sort({ roadmapVersion: -1 });
    if (!roadmap) throw ApiError.notFound("No career roadmap exists for this resume");
    res.json({ roadmap });
}));

router.get("/:id", validate(idParam, "params"), asyncHandler(async (req, res) => {
    res.json({ roadmap: await loadRoadmap(req) });
}));

router.patch("/:id/progress", validate(idParam, "params"), validate(progressSchema), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const task = roadmap.dailyTasks.id(req.body.taskId);
    if (!task) throw ApiError.notFound("Roadmap task not found");
    task.status = req.body.status;
    if (req.body.notes !== undefined) task.notes = req.body.notes;
    if (req.body.skipReason !== undefined) task.skipReason = req.body.skipReason;
    if (req.body.scheduledFor !== undefined) task.scheduledFor = new Date(req.body.scheduledFor);
    if (req.body.scheduledDate !== undefined) task.scheduledDate = req.body.scheduledDate;
    if (req.body.learningMinutes !== undefined) task.learningMinutes = req.body.learningMinutes;
    task.completedAt = req.body.status === "completed" ? new Date() : undefined;
    const totalTasks = roadmap.dailyTasks.length;
    const completedTasks = roadmap.dailyTasks.filter((item) => item.status === "completed").length;
    roadmap.progress = { ...roadmap.progress.toObject(), totalTasks, completedTasks, overallPercent: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0, lastActivityAt: new Date() };
    roadmap.readiness = { ...roadmap.readiness.toObject(), ...readinessFor(roadmap), assessedAt: new Date() };
    await roadmap.save();
    res.json({ roadmap });
}));

router.get("/:id/calendar", validate(idParam, "params"), validate(calendarQuerySchema, "query"), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const notes = await LearningNote.find({ userId: req.user._id, roadmapId: roadmap._id }).lean();
    const calendar = aggregateCalendarActivity({ tasks: roadmap.dailyTasks.map((task) => task.toObject()), notes }, req.query);
    res.json({ calendar, activities: Object.values(calendar) });
}));

router.get("/:id/calendar/:date", validate(z.object({
    id: z.string().refine(mongoose.isValidObjectId, "Invalid id"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format"),
}), "params"), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const notes = await LearningNote.find({ userId: req.user._id, roadmapId: roadmap._id, noteDate: req.params.date }).lean();
    const calendar = aggregateCalendarActivity({ tasks: roadmap.dailyTasks.map((task) => task.toObject()), notes }, { date: req.params.date });
    res.json({ calendar, activities: Object.values(calendar) });
}));

const noteListQuerySchema = z.object({
    q: z.string().trim().max(200).optional(),
    topic: z.string().trim().max(120).optional(),
    tag: z.string().trim().max(60).optional(),
    noteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    milestoneId: z.string().refine(mongoose.isValidObjectId, "Invalid id").optional(),
    taskId: z.string().refine(mongoose.isValidObjectId, "Invalid id").optional(),
    revisionStatus: z.enum(["draft", "pending", "not_started", "in_progress", "in_review", "needs_review", "reviewed", "revised", "completed", "mastered"]).optional(),
    favorite: z.enum(["true", "false"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
});

router.get("/:id/notes", validate(idParam, "params"), validate(noteListQuerySchema, "query"), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const query = { userId: req.user._id, roadmapId: roadmap._id };
    const { q, topic, tag, noteDate, milestoneId, taskId, revisionStatus, favorite, limit, skip } = req.query;
    if (q) {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$or = [{ title: { $regex: escaped, $options: "i" } }, { content: { $regex: escaped, $options: "i" } }, { topic: { $regex: escaped, $options: "i" } }, { tags: { $regex: escaped, $options: "i" } }];
    }
    if (topic) query.topic = topic;
    if (tag) query.tags = tag;
    if (noteDate) query.noteDate = noteDate;
    if (milestoneId) query.milestoneId = milestoneId;
    if (taskId) query.taskId = taskId;
    if (revisionStatus) query.revisionStatus = revisionStatus;
    if (favorite) query.favorite = favorite === "true";
    const [notes, total] = await Promise.all([
        LearningNote.find(query).sort({ noteDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
        LearningNote.countDocuments(query),
    ]);
    res.json({ notes, total, limit, skip });
}));

router.post("/:id/notes", validate(idParam, "params"), validate(learningNoteSchema), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const note = await LearningNote.create({ ...req.body, userId: req.user._id, roadmapId: roadmap._id, resumeId: roadmap.resumeId });
    res.status(201).json({ note });
}));

async function loadNote(req) {
    const roadmap = await loadRoadmap(req);
    if (!mongoose.isValidObjectId(req.params.noteId)) throw ApiError.badRequest("Invalid note id");
    const note = await LearningNote.findOne({ _id: req.params.noteId, userId: req.user._id, roadmapId: roadmap._id });
    if (!note) throw ApiError.notFound("Learning note not found");
    return { roadmap, note };
}

router.patch("/:id/notes/:noteId", validate(idParam, "params"), validate(learningNoteUpdateSchema), asyncHandler(async (req, res) => {
    const { note } = await loadNote(req);
    Object.assign(note, req.body);
    await note.save();
    res.json({ note });
}));

router.delete("/:id/notes/:noteId", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const { note } = await loadNote(req);
    await note.deleteOne();
    res.status(204).send();
}));

router.patch("/:id/notes/:noteId/revision-status", validate(idParam, "params"), validate(z.object({
    revisionStatus: z.enum(["draft", "pending", "not_started", "in_progress", "in_review", "needs_review", "reviewed", "revised", "completed", "mastered"]),
})), asyncHandler(async (req, res) => {
    const { note } = await loadNote(req);
    note.revisionStatus = req.body.revisionStatus;
    await note.save();
    res.json({ note });
}));

router.post("/:id/assessment", validate(idParam, "params"), validate(assessmentSchema), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const values = Object.values(req.body.answers);
    const answered = values.filter((value) => String(value).trim()).length;
    const score = values.length ? Math.round((answered / values.length) * 100) : 0;
    roadmap.assessments.push({ week: req.body.week, answers: req.body.answers, score, feedback: score >= 70 ? "Keep building evidence through practical work." : "Review the related milestone and try another practice task." });
    roadmap.readiness = { ...roadmap.readiness.toObject(), ...readinessFor(roadmap), assessedAt: new Date() };
    await roadmap.save();
    res.json({ assessment: roadmap.assessments[roadmap.assessments.length - 1], readiness: roadmap.readiness });
}));

router.post("/:id/adapt", validate(idParam, "params"), validate(adaptSchema), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const pending = roadmap.dailyTasks.filter((task) => task.status !== "completed");
    roadmap.dailyTasks = pending.map((task, index) => ({ ...task.toObject(), day: ((index % 7) + 1), status: task.status }));
    roadmap.progress.totalTasks = roadmap.dailyTasks.length;
    roadmap.adaptationHistory.push({ reason: req.body.reason || "Progress update", summary: "Reordered incomplete tasks to keep the roadmap actionable." });
    await roadmap.save();
    res.json({ roadmap });
}));

router.get("/:id/readiness", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const readiness = readinessFor(roadmap);
    roadmap.readiness = { ...roadmap.readiness.toObject(), ...readiness, assessedAt: new Date() };
    await roadmap.save();
    res.json({ readiness: roadmap.readiness });
}));

async function loadMentorConversation(req) {
    const roadmap = await loadRoadmap(req);
    const conversation = await MentorConversation.findOne({
        _id: req.params.conversationId,
        userId: req.user._id,
        roadmapId: roadmap._id,
    });
    if (!conversation) throw ApiError.notFound("Mentor conversation not found");
    return { roadmap, conversation };
}

router.post("/:id/mentor/workspace", validate(idParam, "params"), validate(topicSchema), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const explanation = await generateExplanation({ ...req.body, roadmap });
    const conversation = await MentorConversation.create({
        userId: req.user._id,
        roadmapId: roadmap._id,
        resumeId: roadmap.resumeId,
        topic: req.body.topic,
        explanation,
        messages: [{ role: "user", content: req.body.topic }, { role: "assistant", content: explanation.summary }],
    });
    res.status(201).json({ conversation, explanation });
}));

router.post("/:id/mentor/workspace/stream", validate(idParam, "params"), validate(topicSchema), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    res.status(200);
    res.set({
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    try {
        send("status", { state: "generating" });
        const explanation = await generateExplanation({ ...req.body, roadmap });
        const conversation = await MentorConversation.create({
            userId: req.user._id,
            roadmapId: roadmap._id,
            resumeId: roadmap.resumeId,
            topic: req.body.topic,
            explanation,
            messages: [{ role: "user", content: req.body.topic }, { role: "assistant", content: explanation.summary }],
        });
        const payload = JSON.stringify({ conversation, explanation });
        const chunkSize = 700;
        for (let index = 0; index < payload.length; index += chunkSize) {
            send("chunk", { text: payload.slice(index, index + chunkSize), index: Math.floor(index / chunkSize) });
        }
        send("complete", { conversationId: conversation._id, explanation });
    } catch (error) {
        send("error", { message: "Mentor workspace generation failed" });
    } finally {
        res.end();
    }
}));

router.get("/:id/mentor/conversations", validate(idParam, "params"), validate(z.object({
    bookmarked: z.enum(["true", "false"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
}), "query"), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    const query = { userId: req.user._id, roadmapId: roadmap._id };
    if (req.query.bookmarked) query.bookmarked = req.query.bookmarked === "true";
    const [conversations, total] = await Promise.all([
        MentorConversation.find(query).sort({ lastMessageAt: -1 }).skip(req.query.skip).limit(req.query.limit).lean(),
        MentorConversation.countDocuments(query),
    ]);
    res.json({ conversations, total, limit: req.query.limit, skip: req.query.skip });
}));

router.post("/:id/mentor/conversations/:conversationId/messages", validate(conversationParam, "params"), validate(followUpSchema), asyncHandler(async (req, res) => {
    const { roadmap, conversation } = await loadMentorConversation(req);
    const result = await answerFollowUp({ message: req.body.message, conversation, roadmap });
    conversation.messages.push({ role: "user", content: req.body.message });
    conversation.messages.push({ role: "assistant", content: result.answer });
    conversation.lastMessageAt = new Date();
    await conversation.save();
    res.json({ conversation, message: conversation.messages.at(-1), generated: result.generated });
}));

router.patch("/:id/mentor/conversations/:conversationId/bookmark", validate(conversationParam, "params"), validate(bookmarkSchema), asyncHandler(async (req, res) => {
    const { conversation } = await loadMentorConversation(req);
    conversation.bookmarked = req.body.bookmarked;
    await conversation.save();
    res.json({ conversation });
}));

router.post("/:id/mentor/conversations/:conversationId/save-note", validate(conversationParam, "params"), validate(saveNoteSchema), asyncHandler(async (req, res) => {
    const { roadmap, conversation } = await loadMentorConversation(req);
    const noteDate = req.body.noteDate || new Date().toISOString().slice(0, 10);
    const note = await LearningNote.create({
        userId: req.user._id,
        roadmapId: roadmap._id,
        resumeId: roadmap.resumeId,
        noteDate,
        title: req.body.title || conversation.topic,
        topic: conversation.topic,
        tags: req.body.tags,
        revisionStatus: req.body.revisionStatus,
        milestoneId: req.body.milestoneId,
        taskId: req.body.taskId,
        content: [
            conversation.explanation.summary,
            ...conversation.explanation.concepts.map((item) => `Concept: ${item}`),
            ...conversation.explanation.steps.map((item) => `Step: ${item}`),
            ...conversation.explanation.examples.map((item) => `Example: ${item}`),
            ...conversation.messages.filter((item) => item.role === "user").slice(1).map((item) => `Question: ${item.content}`),
        ].join("\n\n").slice(0, 20000),
    });
    conversation.savedNoteId = note._id;
    await conversation.save();
    res.status(201).json({ note, conversation });
}));

router.post("/:id/mentor-question", validate(idParam, "params"), validate(mentorSchema), asyncHandler(async (req, res) => {
    const roadmap = await loadRoadmap(req);
    res.json(await mentorAnswer({ question: req.body.question, roadmap }));
}));

module.exports = router;
