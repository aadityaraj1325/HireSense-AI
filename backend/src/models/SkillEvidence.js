const mongoose = require("mongoose");

const evidenceSourceSchema = new mongoose.Schema(
    {
        platform: { type: String, required: true },
        activityId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformActivity" },
        title: { type: String, required: true, trim: true },
        sourceUrl: { type: String, trim: true },
        timestamp: { type: Date, default: Date.now },
        description: { type: String, trim: true, default: "" },
        metricValue: { type: String, trim: true, default: "" },
    },
    { _id: true }
);

const skillEvidenceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        skillName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        category: {
            type: String,
            enum: [
                "frontend",
                "backend",
                "dsa",
                "database",
                "devops",
                "ai_ml",
                "system_design",
                "general",
            ],
            default: "general",
        },
        evidenceLevel: {
            type: Number,
            enum: [1, 2, 3, 4],
            default: 1, // 1: Activity recorded, 2: Repeated practice, 3: Practical project evidence, 4: Independently verifiable
        },
        statusLabel: {
            type: String,
            enum: [
                "Practiced",
                "Demonstrated in a project",
                "Repeatedly demonstrated",
                "Verified by supported evidence",
            ],
            default: "Practiced",
        },
        targetRoleRelevance: {
            type: String,
            enum: ["Core Requirement", "Important", "Supporting", "Bonus"],
            default: "Important",
        },
        readinessStatus: {
            type: String,
            enum: [
                "demonstrated",
                "partial_evidence",
                "needs_practical_evidence",
                "not_demonstrated",
            ],
            default: "partial_evidence",
        },
        evidenceSources: [evidenceSourceSchema],
        occurrenceCount: {
            type: Number,
            default: 1,
        },
        lastDemonstratedAt: {
            type: Date,
            default: Date.now,
        },
        isUserVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

skillEvidenceSchema.index({ userId: 1, skillName: 1 }, { unique: true });
skillEvidenceSchema.index({ userId: 1, category: 1 });
skillEvidenceSchema.index({ userId: 1, readinessStatus: 1 });

module.exports = mongoose.model("SkillEvidence", skillEvidenceSchema);

