const mongoose = require("mongoose");

const RevisionLogSchema = new mongoose.Schema(
    {
        date: { type: Date, default: Date.now },
        rating: {
            type: String,
            enum: ["forgot", "difficult", "moderate", "easy", "mastered"],
            required: true,
        },
        intervalDays: { type: Number, default: 1 },
    },
    { _id: false }
);

const TargetTopicSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TargetExam",
            required: true,
            index: true,
        },
        subjectId: {
            type: String,
            default: "core",
        },
        subjectName: {
            type: String,
            default: "Core Subject",
        },
        name: {
            type: String,
            trim: true,
        },
        title: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        priority: {
            type: String,
            default: "high",
        },
        priorityRank: {
            type: Number,
            default: 1,
            min: 1,
            max: 10,
            index: true,
        },
        estimatedHours: {
            type: Number,
            default: 2,
        },
        actualHours: {
            type: Number,
            default: 0,
        },
        difficulty: {
            type: String,
            default: "medium",
        },
        status: {
            type: String,
            enum: ["not_started", "learning", "completed", "needs_revision", "mastered"],
            default: "not_started",
            index: true,
        },
        confidenceRating: {
            type: mongoose.Schema.Types.Mixed, // 1 to 5 or text descriptor
            default: 3,
        },
        notes: {
            type: String,
            default: "",
        },
        completedAt: {
            type: Date,
            default: null,
        },
        masteredAt: {
            type: Date,
            default: null,
        },
        revisions: [RevisionLogSchema],
        lastRevisedAt: {
            type: Date,
            default: null,
        },
        nextRevisionDate: {
            type: String, // "YYYY-MM-DD"
            default: null,
            index: true,
        },
        revisionCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

TargetTopicSchema.pre("validate", function () {
    if (!this.name && this.title) this.name = this.title;
    if (!this.title && this.name) this.title = this.name;
    if (!this.subjectId && this.subjectName) this.subjectId = this.subjectName;
    if (!this.subjectName && this.subjectId) this.subjectName = this.subjectId;

    if (typeof this.confidenceRating === "string") {
        const ratingMap = { forgot: 1, difficult: 2, moderate: 3, easy: 4, mastered: 5 };
        this.confidenceRating = ratingMap[this.confidenceRating.toLowerCase()] || 3;
    }

    if (!this.priorityRank) {
        const p = String(this.priority || "").toLowerCase();
        if (p === "1" || p === "priority_1" || p === "must_know" || p === "critical" || p === "high") {
            this.priorityRank = 1;
        } else if (p === "2" || p === "priority_2" || p === "medium") {
            this.priorityRank = 2;
        } else {
            this.priorityRank = 3;
        }
    }
});

TargetTopicSchema.index({ userId: 1, examId: 1, subjectId: 1 });

module.exports = mongoose.model("TargetTopic", TargetTopicSchema);

