const { z } = require("zod");
const { callGeminiWithFallback } = require("./geminiService");

const explanationValidator = z.object({
    summary: z.string().trim().min(1).max(6000),
    concepts: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
    steps: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
    examples: z.array(z.string().trim().min(1).max(1500)).max(20).default([]),
    pitfalls: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
    practiceQuestions: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
    resources: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
});

const topicSchema = z.object({
    topic: z.string().trim().min(3).max(240),
    context: z.string().trim().max(4000).optional().default(""),
});
const followUpSchema = z.object({ message: z.string().trim().min(1).max(4000) });
const bookmarkSchema = z.object({ bookmarked: z.boolean() });
const saveNoteSchema = z.object({
    title: z.string().trim().min(1).max(180).optional(),
    noteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
    revisionStatus: z.enum(["draft", "pending", "not_started", "in_progress", "in_review", "needs_review", "reviewed", "revised", "completed", "mastered"]).optional().default("pending"),
    milestoneId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
    taskId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
});

const explanationResponseSchema = {
    type: "OBJECT",
    required: ["summary", "concepts", "steps", "examples", "pitfalls", "practiceQuestions", "resources"],
    properties: {
        summary: { type: "STRING" },
        concepts: { type: "ARRAY", items: { type: "STRING" } },
        steps: { type: "ARRAY", items: { type: "STRING" } },
        examples: { type: "ARRAY", items: { type: "STRING" } },
        pitfalls: { type: "ARRAY", items: { type: "STRING" } },
        practiceQuestions: { type: "ARRAY", items: { type: "STRING" } },
        resources: { type: "ARRAY", items: { type: "STRING" } },
    },
};

function roadmapContext(roadmap) {
    return JSON.stringify({
        targetJob: roadmap.targetJob,
        skillGaps: roadmap.skillGaps,
        milestones: roadmap.milestones,
    });
}

function deterministicExplanation(topic) {
    return {
        summary: `Build a practical understanding of ${topic} by connecting the core idea to a small exercise.`,
        concepts: [`Core purpose of ${topic}`, `Common use cases for ${topic}`],
        steps: [`Define the problem ${topic} solves`, "Work through a small example", "Explain the trade-offs in your own words"],
        examples: [`Create a small practice exercise using ${topic}.`],
        pitfalls: ["Memorizing terms without applying them", "Skipping validation of assumptions"],
        practiceQuestions: [`How would you apply ${topic} in your target role?`],
        resources: [],
    };
}

async function generateExplanation({ topic, context, roadmap }) {
    const prompt = [
        "You are a career mentor. Give a clear, actionable learning explanation for the requested topic.",
        "Use the roadmap context to tailor depth and examples to the learner's target role and skill gaps.",
        "Do not claim the learner has completed anything. Return only JSON matching the schema.",
        `TOPIC: ${topic}`, `LEARNER CONTEXT: ${context || "none"}`, `ROADMAP: ${roadmapContext(roadmap)}`,
    ].join("\n");
    try {
        const response = await callGeminiWithFallback(prompt, explanationResponseSchema, 0.3);
        return explanationValidator.parse(JSON.parse(response.text));
    } catch (_) {
        return deterministicExplanation(topic);
    }
}

async function answerFollowUp({ message, conversation, roadmap }) {
    const prompt = [
        "You are a career mentor continuing a learning conversation.",
        "Answer the learner's follow-up accurately and concisely using the topic, prior messages, and roadmap.",
        "Return only JSON with a single answer string.",
        `TOPIC: ${conversation.topic}`, `FOLLOW-UP: ${message}`,
        `PRIOR MESSAGES: ${JSON.stringify(conversation.messages.slice(-12))}`,
        `ROADMAP: ${roadmapContext(roadmap)}`,
    ].join("\n");
    try {
        const response = await callGeminiWithFallback(prompt, { type: "OBJECT", required: ["answer"], properties: { answer: { type: "STRING" } } }, 0.3);
        const answer = z.object({ answer: z.string().trim().min(1).max(20000) }).parse(JSON.parse(response.text)).answer;
        return { answer, generated: true };
    } catch (_) {
        return { answer: `Try applying ${conversation.topic} to a small example, then compare the result with the concept you are reviewing.`, generated: false };
    }
}

module.exports = {
    topicSchema, followUpSchema, bookmarkSchema, saveNoteSchema,
    generateExplanation, answerFollowUp, explanationValidator,
};
