const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
    analyzeJobDescription,
    generateStudioOpening,
    processConversationalTurn,
    generateComprehensiveReport,
} = require("./liveInterviewStudioService");

describe("Live Interview Studio Service", () => {
    const sampleResume = `
Aditya Raj
Full Stack Engineer
Skills: React, Node.js, Express, MongoDB, TailwindCSS, REST APIs, System Design
Projects:
- HireSense AI: Intelligent career platform with real-time interview simulator and gap analytics.
- DevTracker: Automated developer progress tracker integrating GitHub, LeetCode, and Codeforces.
    `;

    const sampleParsed = {
        skills: ["React", "Node.js", "Express", "MongoDB", "TailwindCSS", "System Design"],
        projects: [
            { title: "HireSense AI", description: "Intelligent career platform with real-time interview simulator." },
            { title: "DevTracker", description: "Automated developer progress tracker." },
        ],
    };

    const sampleJd = `
Senior Full Stack Engineer at TechCorp.
Requirements: Strong proficiency in Node.js, React, distributed systems, and real-time APIs.
Experience with system architecture, database optimization, and CI/CD pipelines.
    `;

    it("should analyze a job description and extract requirements", async () => {
        const analysis = await analyzeJobDescription(sampleJd, "Senior Full Stack Engineer");
        assert.ok(analysis.targetRole, "Target role should be defined");
        assert.ok(Array.isArray(analysis.requiredSkills), "Required skills should be an array");
        assert.ok(Array.isArray(analysis.responsibilities), "Responsibilities should be an array");
    });

    it("should generate a studio opening grounded in resume and job context", async () => {
        const opening = await generateStudioOpening({
            resumeText: sampleResume,
            parsedSections: sampleParsed,
            targetJob: "Senior Full Stack Engineer",
            jobAnalysis: {
                companyName: "TechCorp",
                targetRole: "Senior Full Stack Engineer",
                requiredSkills: ["Node.js", "React"],
            },
            interviewType: "technical",
            personality: "professional",
            duration: 30,
        });

        assert.ok(opening.spokenGreeting, "Spoken greeting should be non-empty");
        assert.ok(opening.openingQuestion, "Opening question should be defined");
        assert.ok(opening.openingQuestion.prompt, "Opening prompt should be defined");
    });

    it("should process a conversational turn with adaptive feedback", async () => {
        const mockSession = {
            targetJob: "Senior Full Stack Engineer",
            interviewType: "technical",
            interviewerPersonality: "professional",
            currentDifficulty: "intermediate",
            activeTopic: "State Management and System Scaling",
            conversationHistory: [
                { role: "interviewer", text: "How did you design the state management for HireSense AI?" },
            ],
            questions: [
                { prompt: "How did you design the state management for HireSense AI?", difficulty: "intermediate" },
            ],
        };

        const turn = await processConversationalTurn({
            session: mockSession,
            candidateMessage: "We used React Query for server state caching and React Context for active audio streams and auth.",
            isInterruption: false,
            resumeText: sampleResume,
            parsedSections: sampleParsed,
        });

        assert.ok(turn.interviewerSpokenReply, "Interviewer spoken reply should exist");
        assert.ok(turn.evaluation, "Evaluation rubric should exist");
        assert.ok(typeof turn.evaluation.correctness === "number", "Correctness score should be a number");
        assert.ok(Array.isArray(turn.evaluation.strengths), "Strengths should be an array");
    });

    it("should generate a comprehensive post-interview intelligence report", async () => {
        const mockSession = {
            targetJob: "Senior Full Stack Engineer",
            interviewType: "technical",
            interviewerPersonality: "professional",
            currentDifficulty: "intermediate",
            conversationHistory: [
                { role: "interviewer", text: "Tell me about your architecture." },
                { role: "candidate", text: "I used Node.js microservices with Redis queues." },
            ],
            questions: [
                {
                    prompt: "Tell me about your architecture.",
                    answer: "I used Node.js microservices with Redis queues.",
                    evaluation: {
                        correctness: 8,
                        relevance: 9,
                        clarity: 8,
                        technicalDepth: 7,
                        overallScore: 80,
                        strengths: ["Clear microservices architecture"],
                        weakConcepts: ["Failure recovery"],
                    },
                },
            ],
            performance: {
                averageScore: 80,
                correctness: 8,
                relevance: 9,
                clarity: 8,
                technicalDepth: 7,
            },
        };

        const report = await generateComprehensiveReport({
            session: mockSession,
            resumeText: sampleResume,
            parsedSections: sampleParsed,
        });

        assert.ok(report.overallScore > 0, "Overall score should be greater than zero");
        assert.ok(Array.isArray(report.revisionPlan7Days), "7-day revision plan should exist");
        assert.equal(report.revisionPlan7Days.length, 7, "7-day plan should have 7 days");
        assert.ok(Array.isArray(report.learningPlan30Days), "30-day plan should exist");
        assert.ok(Array.isArray(report.recommendedProjects), "Recommended projects should exist");
    });
});

