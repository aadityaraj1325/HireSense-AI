const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        prompt: { type: String, required: true },
        type: { type: String, enum: ["technical", "hr", "project", "follow-up"], required: true },
        difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
        focus: { type: String, required: true },
        expectedConcepts: { type: [String], default: [] },
        answer: { type: String, default: "" },
        answerSource: { type: String, enum: ["text", "voice"], default: "text" },
        evaluation: {
            correctness: { type: Number, min: 0, max: 10 },
            relevance: { type: Number, min: 0, max: 10 },
            clarity: { type: Number, min: 0, max: 10 },
            technicalDepth: { type: Number, min: 0, max: 10 },
            overallScore: { type: Number, min: 0, max: 100 },
            explanation: { type: String, default: "" },
            modelAnswer: { type: String, default: "" },
            weakConcepts: { type: [String], default: [] },
            feedback: { type: String, default: "" },
        },
        answeredAt: Date,
    },
    { _id: true }
);

const interviewSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
        resumeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeVersion", required: true },
        targetJob: { type: String, required: true, trim: true, maxlength: 160 },
        technicalSkills: { type: [String], default: [] },
        requestedDifficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "intermediate",
        },
        currentDifficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "intermediate",
        },
        questionLimit: { type: Number, min: 1, max: 20, default: 8 },
        status: { type: String, enum: ["active", "completed"], default: "active", index: true },
        questions: { type: [questionSchema], default: [] },
        weakConcepts: { type: [String], default: [] },
        performance: {
            answered: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            correctness: { type: Number, default: 0 },
            relevance: { type: Number, default: 0 },
            clarity: { type: Number, default: 0 },
            technicalDepth: { type: Number, default: 0 },
        },
        recommendations: { type: [String], default: [] },
        report: {
            summary: { type: String, default: "" },
            strengths: { type: [String], default: [] },
            focusAreas: { type: [String], default: [] },
        },
        startedAt: { type: Date, default: Date.now },
        completedAt: Date,
    },
    { timestamps: true }
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
