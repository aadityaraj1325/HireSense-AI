const mongoose = require("mongoose");

const platformActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        platform: {
            type: String,
            required: true,
            enum: [
                "github",
                "leetcode",
                "codeforces",
                "hackerrank",
                "codechef",
                "geeksforgeeks",
                "atcoder",
                "kaggle",
                "manual",
                "focus_timer",
            ],
            index: true,
        },
        externalId: {
            type: String,
            trim: true,
            default: null,
        },
        activityType: {
            type: String,
            required: true,
            enum: [
                "commit",
                "pull_request",
                "repo_created",
                "problem_solved",
                "contest",
                "focus_session",
                "learning_task",
                "certification",
                "manual_activity",
            ],
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },
        sourceUrl: {
            type: String,
            trim: true,
            default: "",
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        activityDate: {
            type: String, // YYYY-MM-DD
            required: true,
            index: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        skillTags: [
            {
                type: String,
                trim: true,
            },
        ],
        isManual: {
            type: Boolean,
            default: false,
        },
        verified: {
            type: Boolean,
            default: true,
        },
        verificationLevel: {
            type: Number,
            enum: [1, 2, 3, 4],
            default: 1, // 1: Activity recorded, 2: Repeated practice, 3: Practical project evidence, 4: Independently verifiable
        },
    },
    { timestamps: true }
);

platformActivitySchema.index({ userId: 1, activityDate: -1 });
platformActivitySchema.index({ userId: 1, timestamp: -1 });
platformActivitySchema.index(
    { userId: 1, platform: 1, externalId: 1 },
    { unique: true, sparse: true }
);

module.exports = mongoose.model("PlatformActivity", platformActivitySchema);

