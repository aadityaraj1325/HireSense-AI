const mongoose = require("mongoose");

const RoutineCompletionSchema = new mongoose.Schema(
    {
        date: { type: String, required: true }, // "YYYY-MM-DD"
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
    },
    { _id: false }
);

const TargetRoutineSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        startTime: {
            type: String, // e.g. "06:00 AM" or "06:00"
            required: true,
        },
        endTime: {
            type: String, // e.g. "07:00 AM" or "07:00"
            default: "",
        },
        category: {
            type: String,
            default: "Routine",
        },
        recurringType: {
            type: String,
            enum: ["all", "weekdays", "weekends", "custom"],
            default: "all",
        },
        daysOfWeek: {
            type: [Number], // 0=Sun, 1=Mon, ..., 6=Sat
            default: [0, 1, 2, 3, 4, 5, 6],
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        reminder: {
            type: Boolean,
            default: false,
        },
        completions: [RoutineCompletionSchema],
    },
    { timestamps: true }
);

TargetRoutineSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("TargetRoutine", TargetRoutineSchema);

