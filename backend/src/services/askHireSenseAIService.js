/**
 * Ask HireSense AI Service
 * Grounded conversational assistant leveraging user profile, active resumes,
 * developer evidence, and target career goals.
 */

const { z } = require("zod");
const { callGeminiWithFallback } = require("./geminiService");
const ChatConversation = require("../models/ChatConversation");
const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const SkillEvidence = require("../models/SkillEvidence");
const CareerRoadmap = require("../models/CareerRoadmap");
const ApiError = require("../utils/ApiError");

const chatAiResponseSchema = {
    type: "OBJECT",
    required: ["content", "suggestedActions", "followUpQuestions"],
    properties: {
        content: {
            type: "STRING",
            description: "Comprehensive, high-quality markdown response. Include code blocks, step-by-step logic, practical examples, or interview context where relevant.",
        },
        suggestedActions: {
            type: "ARRAY",
            description: "0 to 3 relevant navigation actions linking to HireSense AI features.",
            items: {
                type: "OBJECT",
                required: ["label", "url"],
                properties: {
                    label: { type: "STRING" },
                    url: { type: "STRING" },
                    type: { type: "STRING" },
                },
            },
        },
        followUpQuestions: {
            type: "ARRAY",
            description: "2 to 3 insightful follow-up questions the user can ask next.",
            items: { type: "STRING" },
        },
    },
};

const chatAiZodSchema = z.object({
    content: z.string().min(1),
    suggestedActions: z.array(
        z.object({
            label: z.string(),
            url: z.string(),
            type: z.string().default("link"),
        })
    ).default([]),
    followUpQuestions: z.array(z.string()).default([]),
});

/**
 * Gather user's background context to ground the assistant.
 */
async function getUserContextSnapshot(userId) {
    const [resumes, analyses, devProfile, evidences, roadmaps] = await Promise.all([
        Resume.find({ userId }).sort({ updatedAt: -1 }).limit(1),
        Analysis.find({ userId }).sort({ createdAt: -1 }).limit(1),
        DeveloperProfile.findOne({ userId }),
        SkillEvidence.find({ userId }).limit(10),
        CareerRoadmap.findOne({ userId }).sort({ updatedAt: -1 }),
    ]);

    const activeResume = resumes[0] || null;
    const latestAnalysis = analyses[0] || null;

    return {
        targetRole: activeResume?.targetRole || devProfile?.targetRole || "Software Engineer",
        resumeTitle: activeResume?.title || "No resume uploaded yet",
        atsScore: latestAnalysis?.atsScore ?? null,
        missingKeywords: latestAnalysis?.keywordsMissing || [],
        presentKeywords: latestAnalysis?.keywordsPresent || [],
        connectedPlatforms: (devProfile?.platforms || []).map((p) => p.platform),
        verifiedSkills: evidences.map((e) => e.skillName),
        roadmapTitle: activeRoadmapTitle(roadmaps),
    };
}

function activeRoadmapTitle(roadmap) {
    if (!roadmap) return "No active roadmap";
    return roadmap.targetRole ? `Roadmap for ${roadmap.targetRole}` : "Active Roadmap";
}

/**
 * Generate AI Response for a conversation turn
 */
async function generateAssistantReply(userId, conversationHistory, latestUserMessage) {
    const context = await getUserContextSnapshot(userId);

    const formattedHistory = conversationHistory.slice(-8).map((m) => {
        return `${m.role.toUpperCase()}: ${m.content}`;
    }).join("\n\n");

    const systemPrompt = [
        "You are Ask HireSense AI, a world-class career strategist, senior technical recruiter, and principal software engineer assistant.",
        "Your role is to guide the candidate with actionable, accurate, and deeply insightful advice across technical interviews, resume engineering, DSA, system design, developer portfolio building, and career growth.",
        "",
        "### CANDIDATE REAL-TIME CONTEXT:",
        `- Target Career Role: ${context.targetRole}`,
        `- Active Resume: ${context.resumeTitle}`,
        `- Latest ATS Score: ${context.atsScore !== null ? `${context.atsScore}/100` : "Not evaluated yet"}`,
        `- Critical Missing Keywords in Resume: ${context.missingKeywords.slice(0, 8).join(", ") || "None identified"}`,
        `- Connected Coding Platforms: ${context.connectedPlatforms.join(", ") || "None"}`,
        `- Verified Skills: ${context.verifiedSkills.join(", ") || "None verified yet"}`,
        "",
        "### RESPONSE INSTRUCTIONS:",
        "1. GROUNDING: Use candidate context whenever the question touches their career, resume, target role, or skills. If they ask about their score or skills, refer to their real data accurately.",
        "2. TECHNICAL DEPTH: When answering technical, programming, or system design questions, provide: (a) Clear conceptual foundation, (b) Step-by-step mechanics, (c) Code snippet with syntax highlighting, (d) Tradeoffs / complexity analysis, (e) Real-world interview perspective.",
        "3. FORMATTING: Use clean GitHub Flavored Markdown with bold headers, bullet lists, and code blocks.",
        "4. SUGGESTED ACTIONS: Suggest 1 to 3 relevant links to HireSense AI features ONLY when genuinely helpful:",
        "   - Resume edits / keywords -> url: '/resumes'",
        "   - Developer tracker / GitHub -> url: '/developer-tracker'",
        "   - Live mock interview -> url: '/interview'",
        "   - Autonomous career intelligence -> url: '/career-intelligence'",
        "5. FOLLOW-UP QUESTIONS: Provide 2 or 3 sharp, logical next questions the user can ask.",
        "",
        "### CONVERSATION HISTORY:",
        formattedHistory || "No previous messages.",
        "",
        `USER QUESTION: ${latestUserMessage}`,
    ].join("\n");

    try {
        const { text } = await callGeminiWithFallback(systemPrompt, chatAiResponseSchema, 0.4);
        const parsed = JSON.parse(text);
        const validated = chatAiZodSchema.parse(parsed);
        return validated;
    } catch (err) {
        console.error("AskHireSenseAI Gemini error, generating deterministic fallback:", err.message);

        // Deterministic contextual fallback
        return generateDeterministicFallback(latestUserMessage, context);
    }
}

/**
 * Deterministic fallback response when Gemini is offline or rate-limited
 */
function generateDeterministicFallback(query, context) {
    const q = query.toLowerCase();

    if (q.includes("resume") || q.includes("ats") || q.includes("score")) {
        return {
            content: `### Resume Optimization & ATS Strategy\n\nYour current resume is evaluated with an ATS readiness score of **${context.atsScore ?? "pending"}/100** for **${context.targetRole}**.\n\n#### Key Findings:\n- **Missing Keywords:** ${context.missingKeywords.slice(0, 5).join(", ") || "Your core keywords are aligned"}.\n- **Impact Metrics:** Ensure every project bullet includes quantified outcomes (e.g., latency reduction, user count, throughput).\n- **Structure:** Maintain clear section headers and avoid non-standard multi-column tables for optimal parsing.\n\nYou can refine your resume bullets directly in the Resume Editor.`,
            suggestedActions: [
                { label: "Open Resume Studio", url: "/resumes", type: "link" },
                { label: "View Career Intelligence", url: "/career-intelligence", type: "link" },
            ],
            followUpQuestions: [
                "How do I naturally incorporate missing keywords into my bullet points?",
                "Can you rewrite a bullet point using the STAR method?",
            ],
        };
    }

    if (q.includes("interview") || q.includes("mock") || q.includes("prepare")) {
        return {
            content: `### Interview Preparation Plan for ${context.targetRole}\n\nTo prepare effectively for upcoming technical rounds:\n\n1. **Core Fundamentals:** Review data structures, time complexity trade-offs, and state management patterns.\n2. **System Design:** Practice decomposing high-level systems into load balancers, caching layers (Redis), and distributed datastores.\n3. **STAR Method:** Structure behavioral answers with clear Situation, Task, Action, and Quantified Result.\n\nPractice in our Live Interview Studio for spoken technical interrogation.`,
            suggestedActions: [
                { label: "Launch Live Interview Studio", url: "/interview", type: "link" },
                { label: "Check AI Career Intelligence", url: "/career-intelligence", type: "link" },
            ],
            followUpQuestions: [
                "What system design questions are most common for this role?",
                "How do I answer 'Tell me about a difficult technical challenge'?",
            ],
        };
    }

    return {
        content: `### Career Insights for ${context.targetRole}\n\nHere are actionable recommendations based on your current HireSense AI profile:\n\n- **Target Role Alignment:** You are targeting **${context.targetRole}**.\n- **Evidence Gathering:** ${context.connectedPlatforms.length > 0 ? `Connected platforms: ${context.connectedPlatforms.join(", ")}.` : "Connect your GitHub in Developer Tracker to verify your coding consistency."}\n- **Next Step:** Review your skill gaps and verify hands-on repositories in the dedicated Career Intelligence dashboard.`,
        suggestedActions: [
            { label: "Open Career Intelligence", url: "/career-intelligence", type: "link" },
            { label: "Open Developer Tracker", url: "/developer-tracker", type: "link" },
        ],
        followUpQuestions: [
            "What technical skills should I prioritize learning next?",
            "How can I improve my project portfolio on GitHub?",
        ],
    };
}

module.exports = {
    getUserContextSnapshot,
    generateAssistantReply,
};

