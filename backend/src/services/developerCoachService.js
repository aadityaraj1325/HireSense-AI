/**
 * AI Developer Coach Service
 * Provides contextual advice using Google Gemini grounded strictly in the developer's
 * actual recorded activities, connected platforms, coding sessions, and target role.
 */

const { z } = require("zod");
const { callGeminiWithFallback } = require("./geminiService");
const DeveloperProfile = require("../models/DeveloperProfile");
const PlatformActivity = require("../models/PlatformActivity");
const CodingSession = require("../models/CodingSession");
const SkillEvidence = require("../models/SkillEvidence");

const coachResponseSchema = {
    type: "OBJECT",
    required: ["answer", "keyInsights", "recommendedNextAction"],
    properties: {
        answer: {
            type: "STRING",
            description: "Detailed, practical, direct response referencing actual data and limitations.",
        },
        keyInsights: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "2 to 4 concrete observations from their real activity.",
        },
        recommendedNextAction: {
            type: "STRING",
            description: "One single immediate, high-leverage technical action to take next.",
        },
    },
};

const coachZodSchema = z.object({
    answer: z.string().min(1),
    keyInsights: z.array(z.string()).min(1).max(5),
    recommendedNextAction: z.string().min(1),
});

/**
 * Ask Developer Coach AI
 */
async function askDeveloperCoach(userId, question) {
    const profile = await DeveloperProfile.findOne({ userId });
    const activities = await PlatformActivity.find({ userId })
        .sort({ timestamp: -1 })
        .limit(25);
    const sessions = await CodingSession.find({ userId })
        .sort({ sessionDate: -1 })
        .limit(10);
    const evidence = await SkillEvidence.find({ userId });

    const connectedPlatforms = (profile?.platforms || [])
        .map((p) => `${p.platform} (${p.status}, handle: ${p.handle})`)
        .join(", ") || "None connected yet";

    const recentActivitySummaries = activities.map((a) =>
        `- [${a.platform}] ${a.activityType}: ${a.title} (${a.activityDate})`
    ).join("\n") || "No activity recorded yet.";

    const sessionSummaries = sessions.map((s) =>
        `- ${s.sessionDate}: ${s.topic} (${s.durationMinutes} mins) - ${s.reflection || "No reflection"}`
    ).join("\n") || "No focus sessions recorded yet.";

    const skillStatusSummaries = evidence.map((e) =>
        `- ${e.skillName}: ${e.statusLabel} (Level ${e.evidenceLevel}/4, ${e.readinessStatus})`
    ).join("\n") || "No skill evidence calculated yet.";

    const prompt = `
You are the HireSense AI Developer Coach. You provide elite, honest, and actionable software engineering career guidance.
You MUST strictly base your answer on the user's real recorded data provided below.

RULES:
1. NEVER fabricate statistics, ratings, or commits.
2. If a platform is not connected or data is missing, state it explicitly as a limitation.
3. Be practical, engineering-focused, and direct (no generic motivational fluff).
4. Relate answers to their target role: "${profile?.targetRole || "Full Stack Engineer"}".

USER'S DATA:
- Target Role: ${profile?.targetRole || "Full Stack Engineer"}
- Connected Platforms: ${connectedPlatforms}
- Overall Stats:
  * Problems Solved: ${profile?.statsSummary?.totalProblemsSolved || 0} (Easy: ${profile?.statsSummary?.easyProblemsSolved || 0}, Med: ${profile?.statsSummary?.mediumProblemsSolved || 0}, Hard: ${profile?.statsSummary?.hardProblemsSolved || 0})
  * GitHub Repos: ${profile?.statsSummary?.githubPublicRepos || 0}, Stars: ${profile?.statsSummary?.githubStars || 0}, Commits: ${profile?.statsSummary?.githubCommits || 0}
  * Active Coding Days: ${profile?.statsSummary?.activeCodingDays || 0}
  * Total Focus Hours: ${Math.round((profile?.statsSummary?.totalFocusMinutes || 0) / 60 * 10) / 10} hrs
  * Codeforces Rating: ${profile?.statsSummary?.currentRating || "Not available"}

RECENT ACTIVITIES (Last 25):
${recentActivitySummaries}

RECENT FOCUS SESSIONS:
${sessionSummaries}

PROOF-OF-WORK SKILL EVIDENCE:
${skillStatusSummaries}

USER'S QUESTION:
"${question}"
`;

    try {
        const { text } = await callGeminiWithFallback(prompt, coachResponseSchema, 0.25);
        const parsed = JSON.parse(text);
        return coachZodSchema.parse(parsed);
    } catch (err) {
        // Deterministic fallback if AI is unavailable or offline
        return {
            answer: `Based on your connected platforms (${connectedPlatforms}), you have ${profile?.statsSummary?.totalProblemsSolved || 0} problems solved, ${profile?.statsSummary?.githubCommits || 0} GitHub commits recorded, and ${profile?.statsSummary?.activeCodingDays || 0} active days logged for your target role of ${profile?.targetRole || "Full Stack Engineer"}. Ensure all your accounts are synced to get complete recommendations.`,
            keyInsights: [
                `Active tracking on ${connectedPlatforms || "manual logs"}`,
                `Targeting ${profile?.targetRole || "Full Stack Engineer"}`,
                `${profile?.statsSummary?.totalProblemsSolved || 0} problems solved across connected sources`,
            ],
            recommendedNextAction: "Log a focused 45-minute coding session on your core target skills and push your latest code to GitHub.",
        };
    }
}

module.exports = {
    askDeveloperCoach,
};

