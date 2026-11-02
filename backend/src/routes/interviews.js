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
const {
    analyzeJobDescription,
    generateStudioOpening,
    processConversationalTurn,
    generateComprehensiveReport,
} = require("../services/liveInterviewStudioService");

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

const analyzeJdSchema = z.object({
    jobDescription: z.string().trim().min(10, "Job description must be at least 10 characters").max(50000),
    targetRole: z.string().trim().max(160).optional(),
});

const studioInitSchema = z.object({
    resumeId: objectId,
    versionId: objectId.nullable().optional(),
    targetJob: z.string().trim().min(1, "Target job is required").max(200),
    jobDescription: z.string().trim().max(50000).nullable().optional().default(""),
    jobAnalysis: z.object({
        companyName: z.string().nullable().optional(),
        targetRole: z.string().nullable().optional(),
        requiredSkills: z.array(z.string()).nullable().optional(),
        preferredSkills: z.array(z.string()).nullable().optional(),
        responsibilities: z.array(z.string()).nullable().optional(),
        experienceYears: z.string().nullable().optional(),
        keywords: z.array(z.string()).nullable().optional(),
    }).nullable().optional(),
    interviewType: z.enum(["technical", "hr", "behavioral", "project", "system_design", "mixed"]).default("technical"),
    difficulty: z.enum(["beginner", "intermediate", "advanced", "adaptive"]).default("adaptive"),
    duration: z.number().int().min(5).max(120).default(30),
    interviewerPersonality: z.enum(["professional", "friendly", "strict", "challenging"]).default("professional"),
    voiceName: z.string().trim().max(80).nullable().optional().default("en-US-Neural2-F"),
    interviewStyle: z.enum(["conversational", "structured"]).default("conversational"),
    technicalSkills: z.array(z.string().trim().max(120)).max(100).default([]),
});

const studioTurnSchema = z.object({
    candidateMessage: z.string().trim().min(1).max(15000),
    isInterruption: z.boolean().default(false),
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

const sessionLocks = new Map();

async function acquireSessionLock(sessionId) {
    const key = String(sessionId);
    while (sessionLocks.has(key)) {
        await sessionLocks.get(key);
    }
    let release;
    const promise = new Promise((resolve) => {
        release = resolve;
    });
    sessionLocks.set(key, promise);
    return () => {
        sessionLocks.delete(key);
        release();
    };
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

/* ==========================================================================
   Live Interview Studio Endpoints
   ========================================================================== */

/**
 * POST /api/interviews/analyze-jd
 * Extract structured role requirements, technical expectations, and company context
 */
router.post("/analyze-jd", analyzeLimiter, validate(analyzeJdSchema), asyncHandler(async (req, res) => {
    const analysis = await analyzeJobDescription(req.body.jobDescription, req.body.targetRole);
    res.json({ jobAnalysis: analysis });
}));

/**
 * POST /api/interviews/studio/init
 * Initialize a full Live Interview Studio session
 */
router.post("/studio/init", analyzeLimiter, validate(studioInitSchema), asyncHandler(async (req, res) => {
    const { resume, version } = await loadResume(req.user._id, req.body.resumeId, req.body.versionId);

    let jobAnalysis = req.body.jobAnalysis;
    if ((!jobAnalysis || Object.keys(jobAnalysis).length === 0) && req.body.jobDescription && req.body.jobDescription.trim().length >= 10) {
        jobAnalysis = await analyzeJobDescription(req.body.jobDescription, req.body.targetJob);
    }

    const opening = await generateStudioOpening({
        resumeText: version.rawText,
        parsedSections: version.parsedSections,
        targetJob: req.body.targetJob,
        jobAnalysis: jobAnalysis || {},
        interviewType: req.body.interviewType,
        personality: req.body.interviewerPersonality,
        duration: req.body.duration,
    });

    const startDifficulty = req.body.difficulty === "adaptive" ? "intermediate" : req.body.difficulty;

    const openQ = opening.openingQuestion || {
        prompt: opening.spokenGreeting || `Welcome to your interview for the ${req.body.targetJob} role. Let us begin.`,
        focus: "Background & Projects",
        type: req.body.interviewType || "technical",
        difficulty: startDifficulty,
        expectedConcepts: [],
    };

    const session = new InterviewSession({
        userId: req.user._id,
        resumeId: resume._id,
        resumeVersionId: version._id,
        mode: "studio",
        targetJob: req.body.targetJob,
        jobDescription: req.body.jobDescription || "",
        jobAnalysis: jobAnalysis || {},
        technicalSkills: [...new Set((req.body.technicalSkills || []).filter(Boolean))],
        interviewType: req.body.interviewType,
        requestedDifficulty: req.body.difficulty,
        currentDifficulty: startDifficulty,
        duration: req.body.duration,
        interviewerPersonality: req.body.interviewerPersonality,
        voiceName: req.body.voiceName || "en-US-Neural2-F",
        interviewStyle: req.body.interviewStyle,
        activeTopic: openQ.focus || "Introduction & Technical Background",
        topicsCovered: [openQ.focus || "Introduction"],
        groundedProjects: openQ.groundedProject ? [openQ.groundedProject] : [],
        conversationHistory: [
            {
                id: `msg-${Date.now()}-greeting`,
                role: "interviewer",
                text: opening.spokenGreeting || openQ.prompt,
                topic: "Greeting & Setup",
                difficultyLevel: startDifficulty,
                isInterruption: false,
                timestamp: new Date(),
            },
            {
                id: `msg-${Date.now()}-q1`,
                role: "interviewer",
                text: openQ.prompt,
                topic: openQ.focus || "Core Experience",
                difficultyLevel: openQ.difficulty || startDifficulty,
                isInterruption: false,
                timestamp: new Date(Date.now() + 150),
            },
        ],
        questions: [
            {
                prompt: openQ.prompt,
                type: openQ.type || "technical",
                difficulty: openQ.difficulty || startDifficulty,
                focus: openQ.focus || "Background & Projects",
                expectedConcepts: openQ.expectedConcepts || [],
            },
        ],
    });

    await session.save();
    res.status(201).json({ session, opening });
}));

/**
 * GET /api/interviews/studio/:id
 * Retrieve live studio session details with populated resume info
 */
router.get("/studio/:id", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user._id })
        .populate("resumeId", "title targetRole")
        .lean();
    if (!session) throw ApiError.notFound("Interview session not found");
    res.json({ session });
}));

/**
 * POST /api/interviews/studio/:id/turn
 * Process live conversational turn (audio transcript or text fallback)
 */
router.post("/studio/:id/turn", analyzeLimiter, validate(idParam, "params"), validate(studioTurnSchema), asyncHandler(async (req, res) => {
    const releaseLock = await acquireSessionLock(req.params.id);
    try {
        const session = await loadSession(req);
        if (session.status === "completed") throw ApiError.badRequest("Interview session is already complete");
        const { version } = await loadResume(req.user._id, session.resumeId, session.resumeVersionId);

        const turnResult = await processConversationalTurn({
            session,
            candidateMessage: req.body.candidateMessage,
            isInterruption: req.body.isInterruption,
            resumeText: version.rawText,
            parsedSections: version.parsedSections,
        });

        // 1. Record candidate speech turn
        session.conversationHistory.push({
            id: `cand-${Date.now()}`,
            role: "candidate",
            text: req.body.candidateMessage,
            topic: session.activeTopic || "Technical Deep Dive",
            difficultyLevel: session.currentDifficulty,
            isInterruption: req.body.isInterruption || false,
            timestamp: new Date(),
        });

        // 2. Attach evaluation to active unanswered question
        const currentQ = session.questions[session.questions.length - 1];
        if (currentQ && !currentQ.answer) {
            currentQ.answer = req.body.candidateMessage;
            currentQ.answerSource = "voice";
            currentQ.answeredAt = new Date();
            currentQ.evaluation = {
                correctness: turnResult.evaluation.correctness,
                relevance: turnResult.evaluation.relevance,
                clarity: turnResult.evaluation.clarity,
                technicalDepth: turnResult.evaluation.technicalDepth,
                practicalUnderstanding: turnResult.evaluation.practicalUnderstanding,
                overallScore: Math.round(
                    (turnResult.evaluation.correctness +
                        turnResult.evaluation.relevance +
                        turnResult.evaluation.clarity +
                        turnResult.evaluation.technicalDepth) * 2.5
                ),
                feedback: turnResult.evaluation.feedback,
                strengths: turnResult.evaluation.strengths,
                weakConcepts: turnResult.evaluation.missingConcepts,
                missingConcepts: turnResult.evaluation.missingConcepts,
                modelAnswer: turnResult.evaluation.modelAnswer,
                improvedAnswer: turnResult.evaluation.improvedAnswer,
            };
            for (const concept of turnResult.evaluation.missingConcepts || []) {
                if (!session.weakConcepts.includes(concept)) session.weakConcepts.push(concept);
            }
        }

        // 3. Record interviewer reply
        session.conversationHistory.push({
            id: `ai-${Date.now()}`,
            role: "interviewer",
            text: turnResult.interviewerSpokenReply,
            topic: turnResult.topic,
            difficultyLevel: turnResult.currentDifficulty,
            isInterruption: false,
            timestamp: new Date(Date.now() + 150),
        });

        // 4. Record new question if session continues
        if (!turnResult.isInterviewComplete) {
            session.questions.push({
                prompt: turnResult.interviewerSpokenReply,
                type: turnResult.questionType || "technical",
                difficulty: turnResult.currentDifficulty,
                focus: turnResult.topic,
                expectedConcepts: turnResult.evaluation.missingConcepts || [],
            });
        }

        // 5. Track dynamic adaptive level shift
        if (turnResult.currentDifficulty !== session.currentDifficulty) {
            session.adaptiveTimeline.push({
                questionIndex: session.questions.length,
                previousScore: currentQ?.evaluation?.overallScore || 70,
                fromDifficulty: session.currentDifficulty,
                toDifficulty: turnResult.currentDifficulty,
                reason: turnResult.difficultyChangeReason || "Adaptive capability tuning",
                timestamp: new Date(),
            });
            session.currentDifficulty = turnResult.currentDifficulty;
        }

        session.activeTopic = turnResult.topic;
        if (!session.topicsCovered.includes(turnResult.topic)) {
            session.topicsCovered.push(turnResult.topic);
        }

        updatePerformance(session);

        // 6. Handle natural conclusion
        if (turnResult.isInterviewComplete) {
            const report = await generateComprehensiveReport({
                session,
                resumeText: version.rawText,
                parsedSections: version.parsedSections,
            });
            session.detailedReport = report;
            session.status = "completed";
            session.completedAt = new Date();
        }

        await session.save();
        res.json({
            interviewerReply: turnResult.interviewerSpokenReply,
            evaluation: turnResult.evaluation,
            topic: turnResult.topic,
            currentDifficulty: session.currentDifficulty,
            isInterviewComplete: turnResult.isInterviewComplete,
            session,
        });
    } finally {
        releaseLock();
    }
}));

/**
 * POST /api/interviews/studio/:id/finish
 * Conclude live interview and generate the comprehensive post-interview intelligence report
 */
router.post("/studio/:id/finish", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    const { version } = await loadResume(req.user._id, session.resumeId, session.resumeVersionId);

    updatePerformance(session);
    if (req.body.monitoring) {
        session.monitoring = {
            ...(session.monitoring || {}),
            ...req.body.monitoring,
        };
    }

    const report = await generateComprehensiveReport({
        session,
        resumeText: version.rawText,
        parsedSections: version.parsedSections,
    });

    session.detailedReport = report;
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

    res.json({ session, report });
}));

/**
 * POST /api/interviews/studio/:id/monitoring
 * Log visual presence and session monitoring telemetry
 */
router.post("/studio/:id/monitoring", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    if (req.body.monitoring) {
        session.monitoring = {
            ...(session.monitoring || {}),
            ...req.body.monitoring,
        };
        await session.save();
    }
    res.json({ success: true, monitoring: session.monitoring });
}));

/**
 * GET /api/interviews/active
 * Check if current user has an ongoing active live interview session
 */
router.get("/active", asyncHandler(async (req, res) => {
    const session = await InterviewSession.findOne({
        userId: req.user._id,
        status: "active",
    })
        .sort({ createdAt: -1 })
        .populate("resumeId", "title targetRole")
        .lean();

    res.json({ session: session || null });
}));

/**
 * Intelligent Live Interview Protocol (IIP) REST Endpoints
 * Supports standard RESTful session operations:
 * POST /sessions, POST /sessions/:id/start, POST /sessions/:id/answer,
 * POST /sessions/:id/repeat, POST /sessions/:id/pause, POST /sessions/:id/resume,
 * POST /sessions/:id/end, GET /sessions/:id, GET /sessions/:id/report
 */

router.post("/sessions", validate(studioInitSchema), asyncHandler(async (req, res, next) => {
    // Forward directly to studio init logic
    req.url = "/studio/init";
    return router.handle(req, res, next);
}));

router.post("/sessions/:id/start", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    session.status = "active";
    if (!session.startedAt) session.startedAt = new Date();
    await session.save();
    res.json({ success: true, session });
}));

router.post("/sessions/:id/answer", validate(idParam, "params"), validate(studioTurnSchema), asyncHandler(async (req, res, next) => {
    req.url = `/studio/${req.params.id}/turn`;
    return router.handle(req, res, next);
}));

router.post("/sessions/:id/repeat", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    const activeQuestion =
        session.conversationHistory?.slice().reverse().find((m) => m.role === "interviewer")?.text ||
        session.questions?.at(-1)?.prompt ||
        "Could you explain your recent technical work?";
    
    session.conversationHistory.push({
        id: `repeat-${Date.now()}`,
        role: "system",
        text: "Candidate requested to repeat the question.",
        timestamp: new Date(),
    });
    await session.save();
    res.json({ success: true, question: activeQuestion });
}));

router.post("/sessions/:id/pause", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    if (session.status === "active") {
        session.status = "paused";
        await session.save();
    }
    res.json({ success: true, session });
}));

router.post("/sessions/:id/resume", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    if (session.status === "paused") {
        session.status = "active";
        await session.save();
    }
    res.json({ success: true, session });
}));

router.post("/sessions/:id/end", validate(idParam, "params"), asyncHandler(async (req, res, next) => {
    req.url = `/studio/${req.params.id}/finish`;
    return router.handle(req, res, next);
}));

router.get("/sessions/:id", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    res.json({ session });
}));

router.get("/sessions/:id/report", validate(idParam, "params"), asyncHandler(async (req, res) => {
    const session = await loadSession(req);
    res.json({ session, report: session.detailedReport || session.report || null });
}));

/* ==========================================================================
   Existing Legacy Interview Endpoints (Preserved Backwards-Compatible)
   ========================================================================== */

router.post("/", analyzeLimiter, validate(createSchema), asyncHandler(async (req, res) => {
    const { resume, version } = await loadResume(req.user._id, req.body.resumeId, req.body.versionId);
    const session = new InterviewSession({
        userId: req.user._id,
        resumeId: resume._id,
        resumeVersionId: version._id,
        mode: "legacy",
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
