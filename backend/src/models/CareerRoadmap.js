const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 180 },
    url: { type: String, trim: true, maxlength: 500 },
    provider: { type: String, trim: true, maxlength: 100 },
    type: { type: String, enum: ["course", "documentation", "article", "video", "practice", "other"], default: "other" },
    verified: { type: Boolean, default: false },
}, { _id: false });

const taskSchema = new mongoose.Schema({
    day: { type: Number, min: 1, max: 7, required: true },
    week: { type: Number, min: 1, required: true },
    title: { type: String, required: true, maxlength: 240 },
    description: { type: String, maxlength: 1200 },
    estimatedMinutes: { type: Number, min: 5, max: 1440, default: 30 },
    status: { type: String, enum: ["pending", "in_progress", "completed", "skipped"], default: "pending" },
    notes: { type: String, maxlength: 2000, default: "" },
    skipReason: { type: String, maxlength: 500, default: "" },
    scheduledFor: Date,
    scheduledDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    learningMinutes: { type: Number, min: 0, max: 1440 },
    completedAt: Date,
    resources: { type: [resourceSchema], default: [] },
}, { _id: true });

const milestoneSchema = new mongoose.Schema({
    week: { type: Number, min: 1, required: true },
    title: { type: String, required: true, maxlength: 180 },
    goals: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    assessment: { type: String, maxlength: 1000 },
}, { _id: true });

const assessmentSchema = new mongoose.Schema({
    submittedAt: { type: Date, default: Date.now },
    week: { type: Number, min: 1 },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    score: { type: Number, min: 0, max: 100 },
    feedback: String,
}, { _id: true });

const careerRoadmapSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    versionId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeVersion", required: true, index: true },
    roadmapVersion: { type: Number, required: true, min: 1 },
    targetJob: {
        title: { type: String, required: true, trim: true, maxlength: 160 },
        company: { type: String, trim: true, maxlength: 160 },
        description: { type: String, trim: true, maxlength: 12000 },
        location: { type: String, trim: true, maxlength: 160 },
        timeframeWeeks: { type: Number, min: 1, max: 52, default: 8 },
        experienceLevel: { type: String, trim: true, maxlength: 40 },
        studyMinutesPerDay: { type: Number, min: 15, max: 480 },
        learningLanguage: { type: String, trim: true, maxlength: 60 },
        learningStyle: { type: String, trim: true, maxlength: 60 },
        specialization: { type: String, trim: true, maxlength: 160 },
    },
    skillGaps: [{
        skill: { type: String, required: true, maxlength: 120 },
        currentLevel: { type: String, enum: ["unknown", "beginner", "intermediate", "advanced"], default: "unknown" },
        targetLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
        priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
        evidence: String,
        learningObjectives: { type: [String], default: [] },
    }],
    milestones: { type: [milestoneSchema], default: [] },
    dailyTasks: { type: [taskSchema], default: [] },
    resources: { type: [resourceSchema], default: [] },
    progress: {
        overallPercent: { type: Number, min: 0, max: 100, default: 0 },
        completedTasks: { type: Number, min: 0, default: 0 },
        totalTasks: { type: Number, min: 0, default: 0 },
        lastActivityAt: Date,
    },
    assessments: { type: [assessmentSchema], default: [] },
    readiness: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        status: { type: String, enum: ["not_started", "developing", "ready"], default: "not_started" },
        gaps: { type: [String], default: [] },
        recommendations: { type: [String], default: [] },
        assessedAt: Date,
    },
    adaptationHistory: [{
        reason: String,
        changedAt: { type: Date, default: Date.now },
        summary: String,
    }],
}, { timestamps: true });

careerRoadmapSchema.index({ userId: 1, createdAt: -1 });
careerRoadmapSchema.index({ userId: 1, resumeId: 1, roadmapVersion: 1 }, { unique: true });

module.exports = mongoose.model("CareerRoadmap", careerRoadmapSchema);
