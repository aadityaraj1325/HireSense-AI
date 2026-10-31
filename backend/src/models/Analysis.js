const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
        explanation: String,
        fix: String,
    },
    { _id: false }
);

const strengthSchema = new mongoose.Schema(
    { title: { type: String, required: true }, evidence: String },
    { _id: false }
);

const bulletRewriteSchema = new mongoose.Schema(
    {
        section: String,
        original: { type: String, required: true },
        rewritten: { type: String, required: true },
        rationale: String,
        resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
        sourceVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeVersion" },
        fieldPath: String,
        originalFingerprint: String,
        requiresConfirmation: { type: Boolean, default: false },
    },
    { _id: true }
);

const originalityIssueSchema = new mongoose.Schema(
    {
        phrase: { type: String, required: true },
        reason: { type: String, required: true },
        suggestion: { type: String, required: true },
    },
    { _id: false }
);

const scoreBreakdownSchema = new mongoose.Schema(
    {
        keywords: { type: Number, min: 0, max: 25 },
        formatting: { type: Number, min: 0, max: 25 },
        impact: { type: Number, min: 0, max: 25 },
        clarity: { type: Number, min: 0, max: 25 },
    },
    { _id: false }
);

const keywordMatchSchema = new mongoose.Schema(
    {
        requirement: String,
        priority: { type: String, enum: ["mandatory", "preferred"] },
        category: String,
        matchType: {
            type: String,
            enum: ["Exact Match", "Synonym Match", "Semantic Match", "Partially Matched", "Missing", "Not Applicable"],
        },
        evidence: String,
        section: String,
        matchedTerm: String,
        jobEvidence: String,
        confidence: { type: Number, min: 0, max: 1 },
    },
    { _id: false }
);

const recommendationSchema = new mongoose.Schema(
    {
        priority: { type: String, enum: ["critical", "high", "medium", "low"] },
        requirement: String,
        whyItMatters: String,
        currentSection: String,
        currentSentence: String,
        suggestedReplacement: String,
        action: String,
        requiresConfirmation: Boolean,
    },
    { _id: false }
);

const analysisSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            required: true,
            index: true,
        },
        versionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ResumeVersion",
            required: true,
            index: true,
        },
        atsScore: { type: Number, min: 0, max: 100, required: true },
        scoreBreakdown: scoreBreakdownSchema,
        issues: { type: [issueSchema], default: [] },
        strengths: { type: [strengthSchema], default: [] },
        bulletRewrites: { type: [bulletRewriteSchema], default: [] },
        keywordsPresent: { type: [String], default: [] },
        keywordsMissing: { type: [String], default: [] },
        summary: { type: String, default: "" },
        jobDescription: { type: String, default: "" },
        targetRole: { type: String, default: "" },
        originalityIssues: { type: [originalityIssueSchema], default: [] },
        suggestedRoles: { type: [String], default: [] },
        model: { type: String, required: true },
        promptTokens: Number,
        responseTokens: Number,
        scoringRubricVersion: { type: String, default: "" },
        atsScoreSource: { type: String, enum: ["gemini", "deterministic"], default: "gemini" },
        jobRequirements: { type: mongoose.Schema.Types.Mixed, default: null },
        compatibilityBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
        keywordMatches: { type: [keywordMatchSchema], default: [] },
        missingRequirements: { type: [String], default: [] },
        improvementRecommendations: { type: [recommendationSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Analysis", analysisSchema);