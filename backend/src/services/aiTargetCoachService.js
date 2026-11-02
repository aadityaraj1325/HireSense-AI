const { callGeminiWithFallback } = require("./geminiService");
const targetService = require("./targetService");

const coachResponseSchema = {
    type: "OBJECT",
    required: ["reply", "insights", "suggestedActions", "focusRecommendation"],
    properties: {
        reply: {
            type: "STRING",
            description: "Coaching response directly addressing the user's question with actionable, empathetic guidance based on their actual productivity schedule.",
        },
        insights: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "2-3 short, bulleted productivity insights derived from the user's current streak, pending tasks, or exams.",
        },
        suggestedActions: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "2-3 concrete next steps the user should perform immediately.",
        },
        focusRecommendation: {
            type: "STRING",
            description: "Single priority task or subject the user should tackle right now.",
        },
    },
};

/**
 * Ask the AI Target Coach
 * Grounded in the user's actual tasks, routines, syllabus progress, exams, streak and reality score.
 */
async function askTargetCoach(userId, userMessage, conversationHistory = []) {
    let dashboard = {};
    let realityScore = { score: 75, grade: "Good", description: "Consistent planning pace." };
    let tasks = [];
    let revisions = [];
    let exams = [];

    try {
        [dashboard, realityScore, tasks, revisions, exams] = await Promise.all([
            targetService.getDashboardMetrics(userId),
            targetService.getGoalRealityScore(userId),
            targetService.getTasks(userId),
            targetService.getDueRevisions(userId),
            targetService.getExams(userId),
        ]);
    } catch (err) {
        console.warn("Failed to fetch full target context for coach:", err);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const pendingTasks = (tasks || []).filter((t) => t.status !== "completed");
    const completedTasks = (tasks || []).filter((t) => t.status === "completed");
    const urgentExams = (exams || []).filter((e) => e.daysRemaining >= 0 && e.daysRemaining <= 30);

    const taskSummaries = pendingTasks.slice(0, 8).map((t) => 
        `- [${t.priority.toUpperCase()}] ${t.title} (${t.category}, ${t.expectedMinutes}m)`
    ).join("\n") || "- No pending tasks right now.";

    const dueRevisionsList = Array.isArray(revisions)
        ? revisions
        : (revisions?.all || [...(revisions?.overdue || []), ...(revisions?.today || [])]);
    const revisionSummaries = dueRevisionsList.slice(0, 5).map((r) =>
        `- Subject: ${r.subjectName || "General"}, Topic: ${r.title || r.name} (Level: ${r.revisionLevel || r.revisionCount || 1})`
    ).join("\n") || "- All spaced revisions up to date.";

    const examSummaries = urgentExams.map((e) =>
        `- ${e.title} (in ${e.daysRemaining} days, Target: ${e.targetScore || "N/A"})`
    ).join("\n") || "- No immediate exams scheduled.";

    const historySummaries = (conversationHistory || []).slice(-4).map((h) =>
        `${h.role === "user" ? "User" : "Coach"}: ${h.text || h.content}`
    ).join("\n");

    const prompt = `
YOU ARE THE HIKESENSE AI TARGET COACH.
You are an elite productivity mentor, academic strategist, and daily execution coach.
You help engineers, students, and professionals plan tonight for tomorrow, maintain study momentum, master spaced-repetition syllabus revision, and overcome procrastination.

CRITICAL INSTRUCTIONS:
- Ground your advice STRICTLY in the user's live productivity metrics provided below.
- Do not fabricate false statistics or exams.
- Be encouraging, disciplined, constructive, and realistic.
- Keep the main reply concise, punchy, and highly actionable (1-3 brief paragraphs).

LIVE USER TARGET METRICS:
- Today's Date: ${todayStr}
- Current Streak: ${dashboard.currentStreak || 0} consecutive days
- Best Streak: ${dashboard.bestStreak || 0} days
- Today's Completion: ${dashboard.completionRate || 0}% (${completedTasks.length} completed, ${pendingTasks.length} pending)
- Study Hours Logged Today: ${dashboard.studyHours || 0} hrs
- Goal Reality Score: ${realityScore.score}/100 (${realityScore.grade}) - ${realityScore.description}
- Upcoming Exam: ${dashboard.upcomingExam ? `${dashboard.upcomingExam.title} (in ${dashboard.upcomingExam.daysRemaining} days)` : "None"}

PENDING TASKS:
${taskSummaries}

DUE SPACED REVISIONS:
${revisionSummaries}

UPCOMING EXAMS:
${examSummaries}

${historySummaries ? `RECENT CONVERSATION HISTORY:\n${historySummaries}\n` : ""}

USER'S MESSAGE:
"${userMessage}"
`;

    try {
        const { text } = await callGeminiWithFallback(prompt, coachResponseSchema, 0.3);
        const parsed = JSON.parse(text);
        return {
            reply: parsed.reply,
            insights: Array.isArray(parsed.insights) ? parsed.insights : [],
            suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
            focusRecommendation: parsed.focusRecommendation || "Execute your highest priority task.",
        };
    } catch (err) {
        console.warn("AI Target Coach fallback triggered:", err.message);
        const topTask = pendingTasks[0]?.title || "Review your daily study agenda";
        return {
            reply: `You're currently holding a ${dashboard.currentStreak || 0}-day streak with a Goal Reality Score of ${realityScore.score}/100 (${realityScore.grade}). You have ${pendingTasks.length} pending items and ${revisions.length} due spaced revisions. Focus on completing one high-impact block right now before adding new tasks.`,
            insights: [
                `Current streak: ${dashboard.currentStreak || 0} active days`,
                `Goal Reality Score: ${realityScore.score}/100 (${realityScore.grade})`,
                `${pendingTasks.length} tasks pending completion`,
            ],
            suggestedActions: [
                `Tackle "${topTask}" for a 45-minute sprint`,
                "Clear overdue spaced repetition topics",
                "Lock in tomorrow's schedule before resting tonight",
            ],
            focusRecommendation: topTask,
        };
    }
}

module.exports = {
    askTargetCoach,
};

