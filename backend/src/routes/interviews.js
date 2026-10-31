const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { analyzeLimiter } = require("../middleware/rateLimit");
const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const InterviewSession = require("../models/InterviewSession");
const {
    generateQuestion,
    evaluateAnswer,
    generateRecommendations,
} = require("../services/interviewService");

const router = express.Router();
router.use(requireAuth);

const objectId = z.string().refine(mongoose.isValidObjectId, "Invalid id");
const idParam = z.object({ id: objectId });
const createSchema = z.object({
    resumeId: objectId,
    versionId: objectId.optional(),
    targetJob: z.string().trim().min(2).max(160),
    technicalSkills: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
    questionLimit: z.number().int().min(1).max(20).default(8),
});
const answerSchema = z.object({
    questionId: objectId,
    answer: z.string().trim().min(10).max(12000),
    answerSource: z.enum(["text", "voice"]).default("text"),
});

async function loadSession(req) {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) throw ApiError.notFound("Interview session not found");
    return session;
}

async function loadResume(userId, resumeId, versionId) {
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw ApiError.notFound("Resume not found");
    const version = await ResumeVersion.findOne({
        _id: versionId || resume.currentVersionId,
        resumeId: resume._id,
    });
    if (!version) throw ApiError.badRequest("Resume has no usable version");
    return { resume, version };
}

function difficultyFor(score, current) {
    const levels = ["beginner", "intermediate", "advanced"];
    const index = levels.indexOf(current);
    if (score >= 80) return levels[Math.min(index + 1, 2)];
    if (score < 50) return levels[Math.max(index - 1, 0)];
    return current;
}

function updatePerformance(session) {
    const answered = session.questions.filter((q) => q.answer && q.evaluation);
    const keys = ["correctness", "relevance", "clarity", "technicalDepth"];
    const totals = Object.fromEntries(keys.map((key) => [key, 0]));
    let overall = 0;
    for (const question of answered) {
        for (const key of keys) totals[key] += question.evaluation[key] || 0;
        overall += question.evaluation.overallScore || 0;
    }
    session.performance = {
        answered: answered.length,
        averageScore: answered.length ? Math.round(overall / answered.length) : 0,
        ...Object.fromEntries(keys.map((key) => [
            key, answered.length ? Math.round((totals[key] / answered.length) * 10) / 10 : 0,
        ])),
    };
}

router.post("/", analyzeLimiter, validate(createSchema), asyncHandler(async (req, res) => {
    const { resume, version } = await loadResume(req.user._id, req.body.resumeId, req.body.versionId);
    const session = new InterviewSession({
        userId: req.user._id,
        resumeId: resume._id,
        resumeVersionId: version._id,
        targetJob: req.body.targetJob,
        technicalSkills: [...new Set(req.body.technicalSkills)],
        requestedDifficulty: req.body.difficulty,
        currentDifficulty: req.body.difficulty,
        questionLimit: req.body.questionLimit,
    });
    const question = await generateQuestion({
        resumeText: version.rawText,
        targetJob: session.targetJob,
        technicalSkills: session.technicalSkills,
        difficulty: session.currentDifficulty,
    });
    session.questions.push({ ...question, difficulty: session.currentDifficulty });
    await session.save();
    res.status(201).json({ session });
}));

router.get("/", asyncHandler(async (req, res) => {
    const sessions = await InterviewSession.find({ userId: req.user._id })
        .select("-questions.expectedConcepts -questions.answer -questions.evaluation")
        .sort({ createdAt: -1 }).lean();
    res.json({ sessions });
}));

router.get("/performance/summary", asyncHandler(async (req, res) => {
    const sessions = await InterviewSession.find({
        userId: req.user._id,
        status: "completed",
    }).select("targetJob performance weakConcepts completedAt").sort({ completedAt: 1 }).lean();
    const answered = sessions.reduce((total, session) => total + (session.performance?.answered || 0), 0);
    const averageScore = sessions.length
        ? Math.round(sessions.reduce((total, session) => total + (session.performance?.averageScore || 0), 0) / sessions.length)
        : 0;
    const concepts = new Map();
    for (const session of sessions) {
        for (const concept of session.weakConcepts || []) {
            concepts.set(concept, (concepts.get(concept) || 0) + 1);
        }
    }
    const weakConcepts = [...concepts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([concept, sessionsCount]) => ({ concept, sessionsCount }));
    res.json({
        sessionsCompleted: sessions.length,
        answered,
        averageScore,
        scoreTrend: sessions.map((session) => ({
            at: session.completedAt,
            score: session.performance?.averageScore || 0,
            targetJob: session.targetJob,
        })),
        weakConcepts,
    });
}));

router.get("/:id", validate(idParam, "params"), asyncHandler(async (req, res) => {
    res.json({ session: await loadSession(req) });
}));

router.post("/:id/answers", analyzeLimiter, validate(idParam, "params"), validate(answerSchema), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    if (session.status === "completed") throw ApiError.badRequest("Interview session is already complete");
    const question = session.questions.id(req.body.questionId);
    if (!question) throw ApiError.notFound("Interview question not found");
    if (question.answer) throw ApiError.badRequest("This question has already been answered");
    const { version } = await loadResume(req.user._id, session.resumeId, session.resumeVersionId);
    const history = session.questions.filter((item) => item.answer).map((item) => ({
        prompt: item.prompt, difficulty: item.difficulty, type: item.type,
        answer: item.answer, score: item.evaluation?.overallScore || 0,
    }));
    const evaluation = await evaluateAnswer({
        resumeText: version.rawText,
        targetJob: session.targetJob,
        technicalSkills: session.technicalSkills,
        question,
        answer: req.body.answer,
        history,
    });
    question.answer = req.body.answer;
    question.answerSource = req.body.answerSource;
    question.evaluation = {
        ...evaluation,
        overallScore: Math.round(
            (evaluation.correctness + evaluation.relevance + evaluation.clarity + evaluation.technicalDepth) * 2.5
        ),
    };
    question.answeredAt = new Date();
    for (const concept of evaluation.weakConcepts) {
        if (!session.weakConcepts.includes(concept)) session.weakConcepts.push(concept);
    }
    updatePerformance(session);
    session.currentDifficulty = difficultyFor(question.evaluation.overallScore, session.currentDifficulty);
    let nextQuestion = null;
    if (session.questions.length < session.questionLimit) {
        nextQuestion = await generateQuestion({
            resumeText: version.rawText,
            targetJob: session.targetJob,
            technicalSkills: session.technicalSkills,
            difficulty: session.currentDifficulty,
            history: [...history, {
                prompt: question.prompt, difficulty: question.difficulty, type: question.type,
                answer: question.answer, score: question.evaluation.overallScore,
            }],
        });
        if (evaluation.followUpQuestion) {
            nextQuestion = {
                prompt: evaluation.followUpQuestion,
                type: "follow-up",
                focus: evaluation.followUpFocus || evaluation.weakConcepts[0] || question.focus,
                expectedConcepts: evaluation.weakConcepts.length ? evaluation.weakConcepts : question.expectedConcepts,
            };
        }
        session.questions.push({ ...nextQuestion, difficulty: session.currentDifficulty });
    }
    await session.save();
    res.json({ evaluation: question.evaluation, nextQuestion: session.questions.at(-1), session });
}));

router.post("/:id/finish", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    if (session.status === "completed") return res.json({ session });
    const { version } = await loadResume(req.user._id, session.resumeId, session.resumeVersionId);
    updatePerformance(session);
    const answers = session.questions.filter((q) => q.answer && q.evaluation).map((q) => ({
        question: q.prompt, score: q.evaluation.overallScore, feedback: q.evaluation.feedback,
    }));
    const report = await generateRecommendations({
        resumeText: version.rawText,
        targetJob: session.targetJob,
        technicalSkills: session.technicalSkills,
        answers,
        weakConcepts: session.weakConcepts,
    });
    session.report = report;
    session.recommendations = report.recommendations;
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();
    res.json({ session });
}));

module.exports = router;
