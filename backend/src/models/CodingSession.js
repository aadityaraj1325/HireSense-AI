const mongoose = require("mongoose");

const codingSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        topic: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        durationMinutes: {
            type: Number,
            required: true,
            min: 1,
            max: 1440,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        sessionDate: {
            type: String, // YYYY-MM-DD
            required: true,
            index: true,
        },
        problemsAttempted: {
            type: Number,
            default: 0,
            min: 0,
        },
        projectWork: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },
        learningObjective: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        reflection: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },
        skillsPracticed: [
            {
                type: String,
                trim: true,
            },
        ],
        completed: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

codingSessionSchema.index({ userId: 1, sessionDate: -1 });
codingSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("CodingSession", codingSessionSchema);

