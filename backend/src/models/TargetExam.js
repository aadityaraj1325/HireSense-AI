const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        name: { type: String, required: true, trim: true },
        color: { type: String, default: "#10b981" },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const TargetExamSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        name: {
            type: String,
            trim: true,
        },
        title: {
            type: String,
            trim: true,
        },
        examDate: {
            type: Date,
            required: true,
        },
        targetScore: {
            type: String,
            default: "",
            trim: true,
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "high",
        },
        description: {
            type: String,
            default: "",
        },
        notes: {
            type: String,
            default: "",
        },
        subjects: [SubjectSchema],
    },
    { timestamps: true }
);

TargetExamSchema.pre("validate", function () {
    if (!this.name && this.title) this.name = this.title;
    if (!this.title && this.name) this.title = this.name;
});

TargetExamSchema.index({ userId: 1, examDate: 1 });

module.exports = mongoose.model("TargetExam", TargetExamSchema);
