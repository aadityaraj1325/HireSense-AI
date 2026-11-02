const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        prompt: { type: String, required: true },
        type: {
            type: String,
            enum: ["technical", "hr", "project", "system_design", "behavioral", "follow-up"],
            required: true,
        },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "adaptive"],
            required: true,
        },
        focus: { type: String, required: true },
        expectedConcepts: { type: [String], default: [] },
        answer: { type: String, default: "" },
        answerSource: { type: String, enum: ["text", "voice"], default: "text" },
        evaluation: {
            correctness: { type: Number, min: 0, max: 10 },
            relevance: { type: Number, min: 0, max: 10 },
            clarity: { type: Number, min: 0, max: 10 },
            technicalDepth: { type: Number, min: 0, max: 10 },
            practicalUnderstanding: { type: Number, min: 0, max: 10, default: 7 },
            overallScore: { type: Number, min: 0, max: 100 },
            explanation: { type: String, default: "" },
            modelAnswer: { type: String, default: "" },
            improvedAnswer: { type: String, default: "" },
            weakConcepts: { type: [String], default: [] },
            strengths: { type: [String], default: [] },
            missingConcepts: { type: [String], default: [] },
            feedback: { type: String, default: "" },
        },
        answeredAt: Date,
    },
    { _id: true }
);

const conversationMessageSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        role: { type: String, enum: ["interviewer", "candidate", "system"], required: true },
        text: { type: String, required: true },
        topic: { type: String, default: "General" },
        difficultyLevel: { type: String, default: "intermediate" },
        isInterruption: { type: Boolean, default: false },
        audioDuration: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const adaptiveStepSchema = new mongoose.Schema(
    {
        questionIndex: Number,
        previousScore: Number,
        fromDifficulty: String,
        toDifficulty: String,
        reason: String,
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const detailedReportSchema = new mongoose.Schema(
    {
        overallScore: { type: Number, default: 0 },
        technicalScore: { type: Number, default: 0 },
        communicationScore: { type: Number, default: 0 },
        problemSolvingScore: { type: Number, default: 0 },
        projectExplanationScore: { type: Number, default: 0 },
        jobRelevanceScore: { type: Number, default: 0 },
        summary: { type: String, default: "" },
        strongConcepts: { type: [String], default: [] },
        weakConcepts: { type: [String], default: [] },
        unansweredOrSkipped: { type: [String], default: [] },
        skillGapAnalysis: [
            {
                skill: String,
                status: String,
                recommendation: String,
            },
        ],
        revisionPlan7Days: [
            {
                day: Number,
                focus: String,
                tasks: [String],
            },
        ],
        learningPlan30Days: [
            {
                week: Number,
                focus: String,
                projects: [String],
                deliverables: String,
            },
        ],
        recommendedProjects: [
            {
                title: String,
                problemSolved: String,
                techStack: [String],
                description: String,
            },
        ],
        questionBreakdown: [
            {
                questionNumber: Number,
                prompt: String,
                transcript: String,
                correctness: Number,
                relevance: Number,
                clarity: Number,
                technicalDepth: Number,
                practicalUnderstanding: Number,
                overallScore: Number,
                strengths: [String],
                missingConcepts: [String],
                modelAnswer: String,
                improvedAnswer: String,
            },
        ],
    },
    { _id: false }
);

const monitoringEventSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
        },
        timestamp: { type: Date, default: Date.now },
        durationSeconds: { type: Number, default: 0 },
        note: { type: String, default: "" },
        resolved: { type: Boolean, default: true },
    },
    { _id: false }
);

const sessionMonitoringSchema = new mongoose.Schema(
    {
        cameraPermissionGranted: { type: Boolean, default: false },
        microphonePermissionGranted: { type: Boolean, default: false },
        cameraUsed: { type: Boolean, default: false },
        microphoneUsed: { type: Boolean, default: false },
        facePresencePct: { type: Number, default: 100 },
        totalFaceAbsentEvents: { type: Number, default: 0 },
        totalMultipleFacesEvents: { type: Number, default: 0 },
        totalTabSwitches: { type: Number, default: 0 },
        events: { type: [monitoringEventSchema], default: [] },
        observationsSummary: { type: String, default: "" },
    },
    { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
        resumeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeVersion", required: true },
        mode: { type: String, enum: ["studio", "legacy"], default: "legacy" },
        targetJob: { type: String, required: true, trim: true, maxlength: 200 },
        jobDescription: { type: String, default: "" },
        jobAnalysis: {
            companyName: { type: String, default: "" },
            targetRole: { type: String, default: "" },
            requiredSkills: { type: [String], default: [] },
            preferredSkills: { type: [String], default: [] },
            responsibilities: { type: [String], default: [] },
            experienceYears: { type: String, default: "" },
            keywords: { type: [String], default: [] },
        },
        technicalSkills: { type: [String], default: [] },
        interviewType: {
            type: String,
            enum: ["technical", "hr", "behavioral", "project", "system_design", "mixed"],
            default: "technical",
        },
        requestedDifficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "adaptive"],
            default: "adaptive",
        },
        currentDifficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "adaptive"],
            default: "intermediate",
        },
        duration: { type: Number, default: 30 },
        interviewerPersonality: {
            type: String,
            enum: ["professional", "friendly", "strict", "challenging"],
            default: "professional",
        },
        voiceName: { type: String, default: "en-US-Neural2-F" },
        interviewStyle: {
            type: String,
            enum: ["conversational", "structured"],
            default: "conversational",
        },
        questionLimit: { type: Number, min: 1, max: 30, default: 10 },
        status: {
            type: String,
            enum: ["setup", "active", "paused", "completed", "interrupted"],
            default: "active",
            index: true,
        },
        conversationHistory: { type: [conversationMessageSchema], default: [] },
        activeTopic: { type: String, default: "Introduction" },
        topicsCovered: { type: [String], default: [] },
        groundedProjects: { type: [String], default: [] },
        adaptiveTimeline: { type: [adaptiveStepSchema], default: [] },
        questions: { type: [questionSchema], default: [] },
        weakConcepts: { type: [String], default: [] },
        performance: {
            answered: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            correctness: { type: Number, default: 0 },
            relevance: { type: Number, default: 0 },
            clarity: { type: Number, default: 0 },
            technicalDepth: { type: Number, default: 0 },
            problemSolving: { type: Number, default: 0 },
            communication: { type: Number, default: 0 },
        },
        recommendations: { type: [String], default: [] },
        report: {
            summary: { type: String, default: "" },
            strengths: { type: [String], default: [] },
            focusAreas: { type: [String], default: [] },
        },
        detailedReport: { type: detailedReportSchema, default: null },
        monitoring: { type: sessionMonitoringSchema, default: () => ({}) },
        startedAt: { type: Date, default: Date.now },
        completedAt: Date,
    },
    { timestamps: true, versionKey: false }
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
