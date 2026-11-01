const mongoose = require("mongoose");

const platformRepositorySchema = new mongoose.Schema(
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
            enum: ["github", "gitlab", "bitbucket", "other"],
            default: "github",
        },
        githubRepoId: {
            type: Number,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        ownerLogin: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        htmlUrl: {
            type: String,
            required: true,
            trim: true,
        },
        visibility: {
            type: String,
            enum: ["public", "private", "internal"],
            default: "public",
        },
        defaultBranch: {
            type: String,
            default: "main",
        },
        language: {
            type: String,
            default: null,
        },
        topics: {
            type: [String],
            default: [],
        },
        stars: {
            type: Number,
            default: 0,
        },
        forks: {
            type: Number,
            default: 0,
        },
        openIssuesCount: {
            type: Number,
            default: 0,
        },
        isFork: {
            type: Boolean,
            default: false,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            required: true,
        },
        updatedAt: {
            type: Date,
            required: true,
        },
        pushedAt: {
            type: Date,
        },
        lastSyncedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index to guarantee no duplicate repositories per user and platform
platformRepositorySchema.index(
    { userId: 1, platform: 1, githubRepoId: 1 },
    { unique: true }
);

platformRepositorySchema.index({ userId: 1, platform: 1, updatedAt: -1 });

module.exports = mongoose.model("PlatformRepository", platformRepositorySchema);

