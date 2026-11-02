const mongoose = require("mongoose");

const TargetAchievementSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        code: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ["streak", "tasks", "exams", "revision", "routine", "discipline"],
            default: "discipline",
        },
        icon: {
            type: String,
            default: "Trophy",
        },
        isUnlocked: {
            type: Boolean,
            default: false,
        },
        unlockedAt: {
            type: Date,
            default: null,
        },
        progress: {
            type: Number,
            default: 0,
        },
        target: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

TargetAchievementSchema.index({ userId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("TargetAchievement", TargetAchievementSchema);

