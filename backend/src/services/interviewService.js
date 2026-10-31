const { z } = require("zod");
const { callGeminiWithFallback } = require("./geminiService");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const questionSchema = z.object({
    prompt: z.string().min(10),
    type: z.enum(["technical", "hr", "project", "follow-up"]),
    focus: z.string().min(1),
    expectedConcepts: z.array(z.string()).min(1).max(8),
});

const evaluationSchema = z.object({
    correctness: z.number().min(0).max(10),
    relevance: z.number().min(0).max(10),
    clarity: z.number().min(0).max(10),
    technicalDepth: z.number().min(0).max(10),
    explanation: z.string().min(1),
    modelAnswer: z.string().min(1),
    weakConcepts: z.array(z.string()).max(8),
    feedback: z.string().min(1),
    followUpQuestion: z.string().min(10).optional(),
    followUpFocus: z.string().min(1).optional(),
});

const recommendationSchema = z.object({
    summary: z.string().min(1),
    strengths: z.array(z.string()).max(8),
    focusAreas: z.array(z.string()).max(8),
    recommendations: z.array(z.string()).min(1).max(10),
});

const questionResponseSchema = {
    type: "OBJECT",
    required: ["prompt", "type", "focus", "expectedConcepts"],
    properties: {
        prompt: { type: "STRING" },
        type: { type: "STRING", enum: ["technical", "hr", "project", "follow-up"] },
        focus: { type: "STRING" },
        expectedConcepts: { type: "ARRAY", items: { type: "STRING" } },
    },
};

const evaluationResponseSchema = {
    type: "OBJECT",
    required: [
        "correctness", "relevance", "clarity", "technicalDepth",
        "explanation", "modelAnswer", "weakConcepts", "feedback",
    ],
    properties: {
        correctness: { type: "NUMBER" },
        relevance: { type: "NUMBER" },
        clarity: { type: "NUMBER" },
        technicalDepth: { type: "NUMBER" },
        explanation: { type: "STRING" },
        modelAnswer: { type: "STRING" },
        weakConcepts: { type: "ARRAY", items: { type: "STRING" } },
        feedback: { type: "STRING" },
        followUpQuestion: { type: "STRING" },
        followUpFocus: { type: "STRING" },
    },
};

const recommendationResponseSchema = {
    type: "OBJECT",
    required: ["summary", "strengths", "focusAreas", "recommendations"],
    properties: {
        summary: { type: "STRING" },
        strengths: { type: "ARRAY", items: { type: "STRING" } },
        focusAreas: { type: "ARRAY", items: { type: "STRING" } },
        recommendations: { type: "ARRAY", items: { type: "STRING" } },
    },
};

function context({ resumeText, targetJob, technicalSkills, difficulty, history }) {
    return [
        `TARGET JOB: ${targetJob}`,
        `TECHNICAL SKILLS: ${technicalSkills.join(", ") || "Infer from resume"}`,
        `CURRENT DIFFICULTY: ${difficulty}`,
        `RESUME: ${resumeText}`,
        history ? `RECENT INTERVIEW CONTEXT:\n${history}` : "",
    ].filter(Boolean).join("\n\n");
}

async function ask(prompt, schema, validator) {
    if (!env.geminiApiKey) {
        throw ApiError.internal("GEMINI_API_KEY is not configured on the server.");
    }
    try {
        const { text } = await callGeminiWithFallback(prompt, schema, 0.35);
        return validator.parse(JSON.parse(text));
    } catch (error) {
        throw ApiError.internal(`Interview AI request failed: ${error.message}`);
    }
}

async function generateQuestion(options) {
    const history = options.history?.slice(-4).map((item) =>
        `Q (${item.difficulty}, ${item.type}): ${item.prompt}\nA: ${item.answer}\nScore: ${item.score}/100`
    ).join("\n\n");
    const prompt = [
        "You are a dynamic technical interviewer.",
        "Generate one personalized interview question. Never use a generic question when the resume, target job, or skills allow a specific one.",
        "Rotate naturally among technical, HR, project, and follow-up questions. For follow-up questions, probe an unanswered or weak concept from the previous response.",
        "Match the requested difficulty exactly. Return JSON only.",
        context({ ...options, history }),
    ].join("\n\n");
    return ask(prompt, questionResponseSchema, questionSchema);
}

async function evaluateAnswer({ resumeText, targetJob, technicalSkills, question, answer, history }) {
    const prompt = [
        "You are an exacting but constructive interviewer evaluating a candidate answer.",
        "Score every dimension from 0 to 10. Correctness is factual accuracy, relevance answers the question, clarity is structure and communication, and technicalDepth measures reasoning and trade-offs.",
        "Use the resume as evidence and do not penalize a candidate for not claiming skills absent from it. Identify concrete weak technical concepts and give a concise model answer.",
        "If the answer is weak or incomplete, generate a personalized follow-up question that targets the weakest concept. Return JSON only.",
        `QUESTION (${question.difficulty}, ${question.type}, focus: ${question.focus}): ${question.prompt}`,
        `EXPECTED CONCEPTS: ${question.expectedConcepts.join(", ")}`,
        `CANDIDATE ANSWER: ${answer}`,
        context({ resumeText, targetJob, technicalSkills, difficulty: question.difficulty, history }),
    ].join("\n\n");
    return ask(prompt, evaluationResponseSchema, evaluationSchema);
}

async function generateRecommendations({ resumeText, targetJob, technicalSkills, answers, weakConcepts }) {
    const prompt = [
        "You are a career coach creating a personalized mock interview report.",
        "Summarize performance, identify strengths and focus areas, and provide actionable revision recommendations grounded in the candidate's resume, target job, answers, and weak concepts. Return JSON only.",
        `TARGET JOB: ${targetJob}`,
        `SKILLS: ${technicalSkills.join(", ")}`,
        `WEAK CONCEPTS: ${weakConcepts.join(", ") || "None identified"}`,
        `ANSWER RECORD:\n${answers.map((a) => `${a.question}\nScore: ${a.score}/100\nFeedback: ${a.feedback}`).join("\n\n")}`,
        `RESUME: ${resumeText}`,
    ].join("\n\n");
    return ask(prompt, recommendationResponseSchema, recommendationSchema);
}

module.exports = { generateQuestion, evaluateAnswer, generateRecommendations };
