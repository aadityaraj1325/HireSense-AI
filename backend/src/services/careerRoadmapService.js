const { z } = require("zod");
const { Type } = require("@google/genai");
const ApiError = require("../utils/ApiError");
const { callGeminiWithFallback } = require("./geminiService");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const targetJobSchema = z.object({
    title: z.string().trim().min(2).max(160),
    company: z.string().trim().max(160).optional(),
    description: z.string().trim().max(12000).optional(),
    location: z.string().trim().max(160).optional(),
    timeframeWeeks: z.number().int().min(1).max(52).default(8),
    experienceLevel: z.string().trim().max(40).optional(),
    studyMinutesPerDay: z.number().int().min(15).max(480).optional(),
    learningLanguage: z.string().trim().max(60).optional(),
    learningStyle: z.string().trim().max(60).optional(),
    specialization: z.string().trim().max(160).optional(),
});
const generateSchema = z.object({
    resumeId: objectId,
    versionId: objectId.optional(),
    targetJob: targetJobSchema,
    force: z.boolean().default(false),
});
const progressSchema = z.object({
    taskId: objectId,
    status: z.enum(["pending", "in_progress", "completed", "skipped"]),
    notes: z.string().max(2000).optional(),
    skipReason: z.string().max(500).optional(),
    scheduledFor: z.string().datetime().optional(),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    learningMinutes: z.coerce.number().int().min(0).max(1440).optional(),
});
const isRealDateOnly = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const dateOnly = z.string().refine(isRealDateOnly, "Expected a valid date in YYYY-MM-DD format");
const learningNoteSchema = z.object({
    noteDate: dateOnly,
    title: z.string().trim().min(1).max(180),
    content: z.string().trim().min(1).max(20000),
    topic: z.string().trim().max(120).optional().default(""),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
    milestoneId: objectId.nullable().optional(),
    taskId: objectId.nullable().optional(),
    favorite: z.boolean().optional(),
    revisionStatus: z.enum(["draft", "pending", "not_started", "in_progress", "in_review", "needs_review", "reviewed", "revised", "completed", "mastered"]).optional(),
});
const learningNoteUpdateSchema = learningNoteSchema.partial();
const calendarQuerySchema = z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected month in YYYY-MM format").optional(),
    date: dateOnly.optional(),
}).refine((value) => value.month || value.date, "month or date is required");

function aggregateCalendarActivity({ tasks = [], notes = [] }, { month, date } = {}) {
    const matches = (key) => date ? key === date : (!month || key.startsWith(`${month}-`));
    const activity = {};
    const add = (key, type, value) => {
        if (!key || !matches(key)) return;
        if (!activity[key]) activity[key] = { date: key, tasks: [], notes: [] };
        activity[key][type].push(value);
    };
    tasks.forEach((task) => {
        const scheduled = task.scheduledDate || task.scheduledFor;
        const key = scheduled instanceof Date ? scheduled.toISOString().slice(0, 10) : (typeof scheduled === "string" ? scheduled.slice(0, 10) : null);
        add(key, "tasks", task);
    });
    notes.forEach((note) => add(note.noteDate, "notes", note));
    return activity;
}
const assessmentSchema = z.object({
    week: z.number().int().min(1).max(52).optional(),
    answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});
const adaptSchema = z.object({ reason: z.string().trim().min(2).max(500).optional() });
const mentorSchema = z.object({ question: z.string().trim().min(3).max(2000) });

const roadmapResponseSchema = {
    type: Type.OBJECT,
    required: ["skillGaps", "milestones", "dailyTasks", "resources"],
    properties: {
        skillGaps: { type: Type.ARRAY, items: { type: Type.OBJECT, required: ["skill", "currentLevel", "targetLevel", "priority", "evidence", "learningObjectives"], properties: {
            skill: { type: "STRING" }, currentLevel: { type: "STRING" }, targetLevel: { type: "STRING" },
            priority: { type: "STRING" }, evidence: { type: "STRING" }, learningObjectives: { type: "ARRAY", items: { type: "STRING" } },
        } } },
        milestones: { type: Type.ARRAY, items: { type: Type.OBJECT, required: ["week", "title", "goals", "skills", "assessment"], properties: {
            week: { type: "NUMBER" }, title: { type: "STRING" }, goals: { type: "ARRAY", items: { type: "STRING" } },
            skills: { type: "ARRAY", items: { type: "STRING" } }, assessment: { type: "STRING" },
        } } },
        dailyTasks: { type: Type.ARRAY, items: { type: Type.OBJECT, required: ["day", "week", "title", "description", "estimatedMinutes"], properties: {
            day: { type: "NUMBER" }, week: { type: "NUMBER" }, title: { type: "STRING" },
            description: { type: "STRING" }, estimatedMinutes: { type: "NUMBER" },
        } } },
        resources: { type: Type.ARRAY, items: { type: Type.OBJECT, required: ["title", "provider", "type"], properties: {
            title: { type: "STRING" }, url: { type: "STRING" }, provider: { type: "STRING" }, type: { type: "STRING" },
        } } },
    },
};

const roadmapOutputValidator = z.object({
    skillGaps: z.array(z.object({
        skill: z.string().trim().min(1).max(120),
        currentLevel: z.enum(["unknown", "beginner", "intermediate", "advanced"]).default("unknown"),
        targetLevel: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        evidence: z.string().max(2000).optional().default(""),
        learningObjectives: z.array(z.string().trim().min(1).max(300)).default([]),
    })).min(1).max(20),
    milestones: z.array(z.object({
        week: z.coerce.number().int().min(1).max(52),
        title: z.string().trim().min(1).max(180),
        goals: z.array(z.string().trim().min(1).max(500)).default([]),
        skills: z.array(z.string().trim().min(1).max(120)).default([]),
        assessment: z.string().max(1000).optional().default(""),
    })).min(1).max(52),
    dailyTasks: z.array(z.object({
        day: z.coerce.number().int().min(1).max(7),
        week: z.coerce.number().int().min(1).max(52),
        title: z.string().trim().min(1).max(240),
        description: z.string().max(1200).optional().default(""),
        estimatedMinutes: z.coerce.number().int().min(5).max(1440).default(30),
    })).min(1).max(365),
    resources: z.array(z.object({
        title: z.string().trim().min(1).max(180),
        url: z.string().url().startsWith("https://").optional(),
        provider: z.string().max(100).optional(),
        type: z.enum(["course", "documentation", "article", "video", "practice", "other"]).default("other"),
    })).max(100).default([]),
});

function validationDetails(error) {
    return error.issues.map((issue) => ({
        field: issue.path.length ? issue.path.join(".") : "roadmap",
        message: issue.message,
        expected: issue.expected || "valid roadmap value",
        received: issue.received || typeof issue.input,
    }));
}

function stripJsonWrapper(text) {
    const value = String(text || "").trim();
    const fenced = value.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidate = fenced ? fenced[1].trim() : value;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    return start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
}

function logValidationFailure(stage, details, generationId) {
    console.error("[career-roadmap validation]", JSON.stringify({
        stage,
        generationId,
        details,
    }));
}

const officialHosts = new Set([
    "developer.mozilla.org", "docs.python.org", "nodejs.org", "react.dev", "learn.microsoft.com",
    "cloud.google.com", "developers.google.com", "github.com", "kubernetes.io", "docs.docker.com",
]);

function normalizeResource(resource) {
    const url = typeof resource.url === "string" && /^https:\/\/[^\s]+$/i.test(resource.url) ? resource.url : undefined;
    let verified = false;
    if (url) {
        try { verified = officialHosts.has(new URL(url).hostname.toLowerCase()); } catch (_) { /* unverified */ }
    }
    return { title: String(resource.title || "Learning resource").slice(0, 180), ...(url ? { url } : {}),
        provider: resource.provider ? String(resource.provider).slice(0, 100) : undefined,
        type: ["course", "documentation", "article", "video", "practice", "other"].includes(resource.type) ? resource.type : "other",
        verified };
}

function deterministicRoadmap({ resumeText, targetJob }) {
    const text = `${resumeText} ${targetJob.description || ""}`.toLowerCase();
    const common = ["JavaScript", "Python", "SQL", "communication", "system design", "testing"];
    const missing = common.filter((skill) => !text.includes(skill.toLowerCase())).slice(0, 4);
    const skillGaps = (missing.length ? missing : ["Target-role fundamentals"]).map((skill, i) => ({
        skill, currentLevel: "unknown", targetLevel: "intermediate", priority: i < 2 ? "high" : "medium",
        evidence: "Not found in the supplied resume or job description evidence.", learningObjectives: [`Build practical ${skill} fluency`],
    }));
    const weeks = Math.min(targetJob.timeframeWeeks, 8);
    const milestones = Array.from({ length: weeks }, (_, i) => ({ week: i + 1, title: `Week ${i + 1}: ${skillGaps[i % skillGaps.length].skill}`, goals: [`Practice ${skillGaps[i % skillGaps.length].skill}`], skills: [skillGaps[i % skillGaps.length].skill], assessment: "Complete a small demonstrable exercise." }));
    const dailyTasks = milestones.flatMap((m) => [1, 3, 5].map((day) => ({ week: m.week, day, title: `${m.title} practice`, description: "Study, apply, and record evidence of progress.", estimatedMinutes: 45 })));
    return { skillGaps, milestones, dailyTasks, resources: [] };
}

async function generateRoadmap(input, options = {}) {
    const fallback = () => deterministicRoadmap(input);
    const generationId = options.generationId || `roadmap-${Date.now()}`;
    let correction = "";
    let lastFailure = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            const prompt = [
                "Create a practical, realistic career growth roadmap.",
                "Return only JSON matching the supplied schema. Never use Markdown fences or explanatory text.",
                "Use numbers for day, week, and estimatedMinutes, not numeric strings.",
                "Use only these enum values: currentLevel unknown|beginner|intermediate|advanced; targetLevel beginner|intermediate|advanced; priority low|medium|high.",
                "Do not invent candidate experience, credentials, or verified resources.",
                correction,
                `Target job: ${JSON.stringify(input.targetJob)}`,
                `Resume evidence: ${String(input.resumeText || "").slice(0, 30000)}`,
            ].filter(Boolean).join("\n");
            const response = await callGeminiWithFallback(prompt, roadmapResponseSchema, 0.2);
            const parsed = JSON.parse(stripJsonWrapper(response.text));
            const validated = roadmapOutputValidator.parse(parsed);
            return {
                ...validated,
                resources: validated.resources.map(normalizeResource),
            };
        } catch (error) {
            lastFailure = error;
            const details = error instanceof z.ZodError
                ? validationDetails(error)
                : [{ field: "response", message: error.message, expected: "JSON object", received: typeof error }];
            logValidationFailure("AI_OUTPUT_VALIDATION", details, generationId);
            if (attempt < 2) {
                correction = `Previous output failed validation. Correct these exact fields and return the complete object: ${JSON.stringify(details)}`;
            }
        }
    }
    if (!options.allowFallback) {
        const details = lastFailure instanceof z.ZodError
            ? validationDetails(lastFailure)
            : [{ field: "response", message: lastFailure?.message || "Invalid AI response", expected: "valid roadmap JSON", received: "invalid" }];
        const err = ApiError.internal("Generated roadmap does not match the expected schema", details, "AI_OUTPUT_VALIDATION");
        err.code = "ROADMAP_VALIDATION_FAILED";
        logValidationFailure("AI_OUTPUT_VALIDATION_FINAL", details, generationId);
        throw err;
    }
    return fallback();
}

function readinessFor(roadmap) {
    const total = roadmap.progress?.totalTasks || roadmap.dailyTasks.length;
    const completed = roadmap.progress?.completedTasks || roadmap.dailyTasks.filter((task) => task.status === "completed").length;
    const assessmentScores = (roadmap.assessments || []).map((a) => a.score).filter(Number.isFinite);
    const assessment = assessmentScores.length ? assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length : 0;
    const score = Math.round((total ? (completed / total) * 70 : 0) + assessment * 0.3);
    const gaps = roadmap.skillGaps.filter((gap) => gap.priority === "high" && completed < total).map((gap) => gap.skill);
    return { score: Math.min(100, score), status: score >= 80 ? "ready" : score >= 35 ? "developing" : "not_started", gaps, recommendations: gaps.map((gap) => `Complete evidence-building practice for ${gap}.`) };
}

async function mentorAnswer({ question, roadmap }) {
    try {
        const response = await callGeminiWithFallback(`Answer this mentor question using only the roadmap context. Do not invent external facts.\nQuestion: ${question}\nRoadmap: ${JSON.stringify({ targetJob: roadmap.targetJob, skillGaps: roadmap.skillGaps })}`, { type: "OBJECT", required: ["answer"], properties: { answer: { type: "STRING" } } }, 0.2);
        const answer = JSON.parse(response.text).answer;
        if (typeof answer === "string" && answer.trim()) return { answer: answer.trim(), generated: true };
    } catch (_) { /* deterministic fallback */ }
    return { answer: `Use your roadmap's current high-priority gaps as the next focus. For "${question}", break the work into a small exercise and record evidence in your completed tasks.`, generated: false };
}

module.exports = {
    generateSchema, progressSchema, assessmentSchema, adaptSchema, mentorSchema,
    dateOnly, learningNoteSchema, learningNoteUpdateSchema, calendarQuerySchema, aggregateCalendarActivity,
    generateRoadmap, readinessFor, mentorAnswer, normalizeResource, deterministicRoadmap,
    roadmapOutputValidator, validationDetails, stripJsonWrapper,
};
