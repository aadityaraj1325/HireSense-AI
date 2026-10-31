const mongoose = require("mongoose");

const learningNoteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerRoadmap", required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    noteDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    content: { type: String, required: true, trim: true, maxlength: 20000 },
    topic: { type: String, trim: true, maxlength: 120, default: "" },
    tags: { type: [String], default: [] },
    milestoneId: { type: mongoose.Schema.Types.ObjectId, default: null },
    taskId: { type: mongoose.Schema.Types.ObjectId, default: null },
    favorite: { type: Boolean, default: false },
    revisionStatus: { type: String, enum: ["draft", "pending", "not_started", "in_progress", "in_review", "needs_review", "reviewed", "revised", "completed", "mastered"], default: "draft" },
}, { timestamps: true });

learningNoteSchema.index({ userId: 1, roadmapId: 1, noteDate: 1 });
learningNoteSchema.index({ userId: 1, roadmapId: 1, tags: 1 });

module.exports = mongoose.model("LearningNote", learningNoteSchema);
