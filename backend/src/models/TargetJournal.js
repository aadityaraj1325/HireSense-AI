const mongoose = require("mongoose");

const TargetJournalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        date: {
            type: String, // "YYYY-MM-DD"
            required: true,
            index: true,
        },
        completedSummary: {
            type: String,
            default: "",
        },
        notCompletedSummary: {
            type: String,
            default: "",
        },
        learnedSummary: {
            type: String,
            default: "",
        },
        problemsFaced: {
            type: String,
            default: "",
        },
        improvementsForTomorrow: {
            type: String,
            default: "",
        },
        tomorrowPriority: {
            type: String,
            default: "",
        },
        moodRating: {
            type: Number, // 1 to 5
            default: 4,
            min: 1,
            max: 5,
        },
        notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

TargetJournalSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("TargetJournal", TargetJournalSchema);

