const mongoose = require("mongoose");

const SubTaskSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
    },
    { _id: false }
);

const TargetTaskSchema = new mongoose.Schema(
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
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        startTime: {
            type: String, // e.g. "09:00"
            default: "",
        },
        endTime: {
            type: String, // e.g. "10:30"
            default: "",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
        },
        category: {
            type: String,
            default: "coding",
            trim: true,
        },
        expectedDuration: {
            type: Number, // in minutes
            default: 60,
        },
        expectedMinutes: {
            type: Number, // in minutes
            default: 60,
        },
        actualDuration: {
            type: Number, // in minutes
            default: 0,
        },
        actualMinutes: {
            type: Number, // in minutes
            default: 0,
        },
        subtasks: [SubTaskSchema],
        notes: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["not_started", "pending", "in_progress", "completed", "rescheduled", "cancelled", "skipped"],
            default: "pending",
            index: true,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        rescheduledToDate: {
            type: String, // "YYYY-MM-DD"
            default: null,
        },
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TargetExam",
            default: null,
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TargetTopic",
            default: null,
        },
    },
    { timestamps: true }
);

TargetTaskSchema.pre("validate", function () {
    if (!this.expectedDuration && this.expectedMinutes) this.expectedDuration = this.expectedMinutes;
    if (!this.expectedMinutes && this.expectedDuration) this.expectedMinutes = this.expectedDuration;
    if (!this.actualDuration && this.actualMinutes) this.actualDuration = this.actualMinutes;
    if (!this.actualMinutes && this.actualDuration) this.actualMinutes = this.actualDuration;
    if (this.category) this.category = this.category.toLowerCase();
});

TargetTaskSchema.index({ userId: 1, date: 1, status: 1 });

module.exports = mongoose.model("TargetTask", TargetTaskSchema);
