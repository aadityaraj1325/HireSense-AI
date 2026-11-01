const mongoose = require("mongoose");

const platformConnectionSchema = new mongoose.Schema(
    {
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
                "other",
            ],
        },
        handle: { type: String, required: true, trim: true },
        profileUrl: { type: String, trim: true },
        connectionType: {
            type: String,
            enum: [
                "oauth",
                "api",
                "public_profile",
                "imported_data",
                "manually_entered",
            ],
            default: "public_profile",
        },
        status: {
            type: String,
            enum: ["connected", "syncing", "error", "disconnected"],
            default: "connected",
        },
        token: { type: String, select: false }, // Optional personal access token (e.g. GitHub PAT for higher rate limits)
        lastSyncAt: { type: Date },
        lastError: { type: String },
        cachedStats: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        permissions: {
            readPublicProfile: { type: Boolean, default: true },
            readPublicRepos: { type: Boolean, default: true },
            readSubmissions: { type: Boolean, default: true },
            includeInResumeBridge: { type: Boolean, default: true },
        },
    },
    { _id: true, timestamps: true }
);

const developerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        targetRole: {
            type: String,
            default: "Full Stack Engineer",
            trim: true,
            maxlength: 120,
        },
        bio: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
        platforms: [platformConnectionSchema],
        weeklyFocusGoalMinutes: {
            type: Number,
            default: 600, // 10 hours
            min: 0,
            max: 5000,
        },
        dailyProblemGoal: {
            type: Number,
            default: 2,
            min: 0,
            max: 50,
        },
        statsSummary: {
            totalProblemsSolved: { type: Number, default: 0 },
            easyProblemsSolved: { type: Number, default: 0 },
            mediumProblemsSolved: { type: Number, default: 0 },
            hardProblemsSolved: { type: Number, default: 0 },
            githubContributionsYear: { type: Number, default: 0 },
            githubPublicRepos: { type: Number, default: 0 },
            githubStars: { type: Number, default: 0 },
            githubCommits: { type: Number, default: 0 },
            githubPullRequests: { type: Number, default: 0 },
            activeCodingDays: { type: Number, default: 0 },
            totalFocusMinutes: { type: Number, default: 0 },
            contestsAttended: { type: Number, default: 0 },
            currentRating: { type: Number, default: null },
            maxRating: { type: Number, default: null },
            lastSyncedAt: { type: Date, default: null },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("DeveloperProfile", developerProfileSchema);
