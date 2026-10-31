const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, trim: true, maxlength: 20000 },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });

const explanationSchema = new mongoose.Schema({
    summary: { type: String, default: "", maxlength: 6000 },
    concepts: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    examples: { type: [String], default: [] },
    pitfalls: { type: [String], default: [] },
    practiceQuestions: { type: [String], default: [] },
    resources: { type: [String], default: [] },
}, { _id: false });

const mentorConversationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerRoadmap", required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    topic: { type: String, required: true, trim: true, maxlength: 240 },
    explanation: { type: explanationSchema, default: () => ({}) },
    messages: { type: [messageSchema], default: [] },
    bookmarked: { type: Boolean, default: false, index: true },
    savedNoteId: { type: mongoose.Schema.Types.ObjectId, ref: "LearningNote", default: null },
    lastMessageAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

mentorConversationSchema.index({ userId: 1, roadmapId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("MentorConversation", mentorConversationSchema);
