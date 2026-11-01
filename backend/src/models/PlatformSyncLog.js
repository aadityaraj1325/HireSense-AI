const mongoose = require("mongoose");

const platformSyncLogSchema = new mongoose.Schema(
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
            enum: ["github", "leetcode", "codeforces", "hackerrank", "codechef", "geeksforgeeks", "atcoder", "kaggle", "other"],
        },
        syncType: {
            type: String,
            enum: ["manual", "webhook", "scheduled", "initial"],
            default: "manual",
        },
        status: {
            type: String,
            enum: ["success", "partial", "failed"],
            default: "success",
        },
        summary: {
            type: String,
            default: "",
        },
        repositoriesDiscovered: {
            type: Number,
            default: 0,
        },
        newRepositoriesCount: {
            type: Number,
            default: 0,
        },
        updatedRepositoriesCount: {
            type: Number,
            default: 0,
        },
        activitiesCount: {
            type: Number,
            default: 0,
        },
        commitsCount: {
            type: Number,
            default: 0,
        },
        rateLimitRemaining: {
            type: Number,
            default: null,
        },
        rateLimitLimit: {
            type: Number,
            default: null,
        },
        rateLimitReset: {
            type: Date,
            default: null,
        },
        error: {
            type: String,
            default: null,
        },
        durationMs: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

platformSyncLogSchema.index({ userId: 1, platform: 1, createdAt: -1 });

module.exports = mongoose.model("PlatformSyncLog", platformSyncLogSchema);

