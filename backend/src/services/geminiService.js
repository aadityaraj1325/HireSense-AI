const { GoogleGenAI, Type } = require("@google/genai");
const { z } = require("zod");

const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const ai = env.geminiApiKey
    ? new GoogleGenAI({ apiKey: env.geminiApiKey })
    : null;

const responseSchema = {
    type: Type.OBJECT,
    required: [
        "atsScore",
        "scoreBreakdown",
        "issues",
        "strengths",
        "bulletRewrites",
        "keywordsPresent",
        "keywordsMissing",
        "summary",
        "originalityIssues",
    ],
    properties: {
        atsScore: { type: Type.NUMBER, description: "ATS-readiness score from 0 to 100" },
        scoreBreakdown: {
            type: Type.OBJECT,
            required: ["keywords", "formatting", "impact", "clarity"],
            properties: {
                keywords: { type: Type.NUMBER, description: "0-25" },
                formatting: { type: Type.NUMBER, description: "0-25" },
                impact: { type: Type.NUMBER, description: "0-25" },
                clarity: { type: Type.NUMBER, description: "0-25" },
            },
        },
        issues: {
            type: Type.ARRAY,
            description: "Exactly 5 prioritized issues",
            items: {
                type: Type.OBJECT,
                required: ["title", "severity", "explanation", "fix"],
                properties: {
                    title: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                    explanation: { type: Type.STRING },
                    fix: { type: Type.STRING },
                },
            },
        },
        strengths: {
            type: Type.ARRAY,
            description: "Exactly 5 strengths",
            items: {
                type: Type.OBJECT,
                required: ["title", "evidence"],
                properties: {
                    title: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                },
            },
        },
        bulletRewrites: {
            type: Type.ARRAY,
            description: "5-10 weak bullets rewritten to be stronger and ATS-friendly",
            items: {
                type: Type.OBJECT,
                required: ["section", "original", "rewritten", "rationale"],
                properties: {
                    section: { type: Type.STRING },
                    original: { type: Type.STRING },
                    rewritten: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                },
            },
        },
        keywordsPresent: { type: Type.ARRAY, items: { type: Type.STRING } },
        keywordsMissing: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary: {
            type: Type.STRING,
            description: "One short paragraph overall verdict",
        },
        originalityIssues: {
            type: Type.ARRAY,
            description: "Potentially generic, copied, or overused resume phrasing with safer alternatives",
            items: {
                type: Type.OBJECT,
                required: ["phrase", "reason", "suggestion"],
                properties: {
                    phrase: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                },
            },
        },
    },
};

const analysisValidator = z.object({
    atsScore: z.number().min(0).max(100),
    scoreBreakdown: z.object({
        keywords: z.number().min(0).max(25),
        formatting: z.number().min(0).max(25),
        impact: z.number().min(0).max(25),
        clarity: z.number().min(0).max(25),
    }),
    issues: z.array(
        z.object({
            title: z.string(),
            severity: z.enum(["low", "medium", "high"]),
            explanation: z.string(),
            fix: z.string(),
        })
    ).min(1),
    strengths: z.array(
        z.object({
            title: z.string(),
            evidence: z.string(),
        })
    ).min(1),
    bulletRewrites: z.array(
        z.object({
            section: z.string(),
            original: z.string(),
            rewritten: z.string(),
            rationale: z.string(),
        })
    ).default([]),
    keywordsPresent: z.array(z.string()).default([]),
    keywordsMissing: z.array(z.string()).default([]),
    summary: z.string(),
    originalityIssues: z.array(
        z.object({
            phrase: z.string(),
            reason: z.string(),
            suggestion: z.string(),
        })
    ).default([]),
});

const roleResponseSchema = {
    type: Type.OBJECT,
    required: ["suggestedRoles"],
    properties: {
        suggestedRoles: {
            type: Type.ARRAY,
            description: "Three to five realistic technical job titles inferred from the job description",
            items: { type: Type.STRING },
        },
    },
};

const jobRequirementsSchema = {
    type: Type.OBJECT,
    required: [
        "mandatorySkills",
        "preferredSkills",
        "technicalRequirements",
        "experienceRequirements",
        "educationRequirements",
        "certifications",
        "responsibilities",
        "keywords",
    ],
    properties: {
        mandatorySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        technicalRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
        experienceRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
        educationRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
        responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
};

const jobRequirementsValidator = z.object({
    mandatorySkills: z.array(z.string()).default([]),
    preferredSkills: z.array(z.string()).default([]),
    technicalRequirements: z.array(z.string()).default([]),
    experienceRequirements: z.array(z.string()).default([]),
    educationRequirements: z.array(z.string()).default([]),
    certifications: z.array(z.string()).default([]),
    responsibilities: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
});

async function extractJobRequirements(jobDescription) {
    if (!ai) throw ApiError.internal("GEMINI_API_KEY is not configured on the server.");
    if (!jobDescription?.trim()) throw ApiError.badRequest("Job description is required for compatibility analysis.");
    const prompt = [
        "Extract structured hiring requirements from this job description.",
        "Separate mandatory from preferred skills. Preserve the employer's terminology.",
        "Do not infer requirements that are not stated. Return only JSON matching the schema.",
        "",
        "JOB DESCRIPTION:",
        jobDescription.trim(),
    ].join("\n");
    const { text, model, usage } = await callGeminiWithFallback(prompt, jobRequirementsSchema, 0.1);
    return {
        requirements: jobRequirementsValidator.parse(JSON.parse(text)),
        model,
        promptTokens: usage.promptTokenCount || 0,
        responseTokens: usage.candidatesTokenCount || 0,
    };
}

async function suggestRoles(jobDescription) {
    if (!ai) {
        throw ApiError.internal("GEMINI_API_KEY is not configured on the server.");
    }
    if (!jobDescription?.trim()) {
        throw ApiError.badRequest("Job description is required to suggest roles.");
    }

    const prompt = [
        "You are a technical recruiter.",
        "Read the job description below and suggest 3 to 5 realistic technical job titles for tailoring a resume.",
        "Prefer titles explicitly stated or strongly supported by the responsibilities and technologies.",
        "Do not invent a seniority level or technology that the job description does not support.",
        "Return only the JSON object matching the response schema.",
        "",
        "JOB DESCRIPTION:",
        jobDescription.trim(),
    ].join("\n");

    try {
        const { text } = await callGeminiWithFallback(prompt, roleResponseSchema, 0.2);
        const parsed = z.object({
            suggestedRoles: z.array(z.string().trim().min(1)).min(1).max(5),
        }).parse(JSON.parse(text));
        return [...new Set(parsed.suggestedRoles)].slice(0, 5);
    } catch (err) {
        throw ApiError.internal(`Role suggestion failed: ${err.message}`);
    }
}

function getGeminiModels() {
    return [...new Set([env.geminiModel, ...env.geminiFallbackModels].filter(Boolean))].slice(0, 2);
}

function isTemporaryGeminiError(err) {
    const message = String(err?.message || err);
    return err?.status >= 500 ||
        err?.status === 429 ||
        /503|429|UNAVAILABLE|high demand|temporar/i.test(message);
}

function isUnavailableModelError(err) {
    const message = String(err?.message || err);
    return err?.status === 404 || /NOT_FOUND|no longer available|not found/i.test(message);
}

async function callGeminiWithFallback(prompt, schema, temperature) {
    let lastErr;
    for (const model of getGeminiModels()) {
        try {
            const result = await Promise.race([
                ai.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema,
                        temperature,
                    },
                }),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error(`Gemini model ${model} timed out after ${env.geminiTimeoutMs / 1000}s`)),
                        env.geminiTimeoutMs
                    )
                ),
            ]);
            const text = typeof result.text === "function" ? result.text() : result.text;
            if (!text) throw new Error("Empty response from Gemini");
            return { text, model, usage: result.usageMetadata || {} };
        } catch (err) {
            lastErr = err;
            if (isUnavailableModelError(err)) continue;
            if (!isTemporaryGeminiError(err) && !/timed out/i.test(String(err.message))) break;
        }
    }
    throw lastErr || new Error("Gemini request failed");
}

async function callGemini(prompt) {
    return callGeminiWithFallback(prompt, responseSchema, 0.4);
}

function buildPrompt({ rawText, targetRole, jobDescription }) {
    return [
        "You are a senior technical recruiter and ATS expert reviewing a resume.",
        targetRole
            ? `Target role: ${targetRole}.`
            : "No specific target role was provided - assess for the role the candidate appears to be aiming for.",
        jobDescription
            ? `JOB DESCRIPTION:\n${jobDescription}`
            : "No job description was provided.",
        "",
        "Score the resume from 0-100 based on ATS readiness (keyword match, parseable formatting, quantified impact, clarity).",
        "Return exactly 5 prioritized issues, 5 standout strengths, and 5-10 weak bullets rewritten to be stronger, quantified, and ATS-friendly.",
        "For every rewrite, copy the COMPLETE original sentence or bullet verbatim from the supplied resume; never truncate it, summarize it, or add an ellipsis. Use the exact resume section name (summary, skills, experience, projects, education, or certifications).",
        "Rewrites must preserve the original meaning. Each rewrite needs a one-line rationale.",
        "Identify keywords clearly present and notable keywords missing for the apparent target role.",
        "When a job description is provided, prioritize its legitimate skills, responsibilities, and terminology, but never add a skill, employer, title, certification, metric, or achievement that is not supported by the resume.",
        "For originalityIssues, identify generic or likely copied/cliche phrases in the supplied resume. This is a wording-quality check, not an internet plagiarism search. Suggest original wording that preserves the candidate's facts. Never invent experience.",
        "Be specific and evidence-based - cite phrasing from the resume in explanations.",
        "",
        "RESUME TEXT:",
        rawText,
    ].join("\n");
}

async function analyzeResume({ rawText, targetRole, jobDescription }) {
    if (!ai) {
        throw ApiError.internal("GEMINI_API_KEY is not configured on the server.");
    }

    const prompt = buildPrompt({ rawText, targetRole, jobDescription });

    let lastErr;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const { text, usage, model } = await callGemini(prompt);
            const parsed = JSON.parse(text);
            const validated = analysisValidator.parse(parsed);
            return {
                analysis: validated,
                model,
                promptTokens: usage.promptTokenCount || 0,
                responseTokens: usage.candidatesTokenCount || 0,
            };
        } catch (err) {
            lastErr = err;
            if (attempt === 2) break;
        }
    }

    throw ApiError.internal(
        `Gemini analysis failed: ${lastErr?.message || "unknown error"}`
    );
}

module.exports = { analyzeResume, suggestRoles, extractJobRequirements, callGeminiWithFallback };