const mongoose = require("mongoose");

const AttachedToSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["exam", "topic", "task", "general"], default: "general" },
        id: { type: String, default: "" },
        name: { type: String, default: "" },
    },
    { _id: false }
);

const HighlightSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        text: { type: String, required: true },
        color: { type: String, default: "yellow" },
        category: { type: String, default: "Important" },
        comment: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const DoubtSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        text: { type: String, required: true },
        title: { type: String, default: "Doubt Concept" },
        category: { type: String, default: "Need an example" },
        status: {
            type: String,
            enum: ["unresolved", "ai_explained", "user_understood", "needs_further_revision", "resolved"],
            default: "unresolved",
        },
        aiExplanation: { type: String, default: "" },
        resolutionNotes: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const FlashcardSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        front: { type: String, required: true },
        back: { type: String, required: true },
        type: { type: String, default: "q_and_a" },
        difficulty: { type: String, default: "medium" },
        confidenceRating: { type: Number, default: 3, min: 1, max: 5 },
        lastReviewed: { type: Date, default: null },
        nextReview: { type: Date, default: () => new Date(Date.now() + 86400000) },
        reviewCount: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const VersionSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        versionNumber: { type: Number, default: 1 },
        title: { type: String, default: "Version" },
        content: { type: String, default: "" },
        wordCount: { type: Number, default: 0 },
        changeSummary: { type: String, default: "Autosave snapshot" },
        savedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const ConnectionSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        targetNoteId: { type: String, default: "" },
        targetTitle: { type: String, default: "" },
        relationshipType: { type: String, default: "related_to" },
        isSuggested: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const LearningSessionSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        durationSeconds: { type: Number, default: 0 },
        completedAt: { type: Date, default: Date.now },
        sectionsUnderstood: [{ type: String }],
        feedback: {
            understood: { type: String, default: "" },
            difficult: { type: String, default: "" },
            needsRevision: { type: String, default: "" },
        },
    },
    { _id: false }
);

const TargetNoteSchema = new mongoose.Schema(
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
            default: "Untitled Note",
        },
        content: {
            type: String,
            default: "",
        },
        folder: {
            type: String,
            default: "General",
            trim: true,
            index: true,
        },
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        color: {
            type: String,
            default: "#10b981",
        },
        isPinned: {
            type: Boolean,
            default: false,
            index: true,
        },
        attachedTo: {
            type: AttachedToSchema,
            default: () => ({ type: "general", id: "", name: "" }),
        },
        wordCount: {
            type: Number,
            default: 0,
        },
        highlights: [HighlightSchema],
        doubts: [DoubtSchema],
        flashcards: [FlashcardSchema],
        versions: [VersionSchema],
        connections: [ConnectionSchema],
        learningSessions: [LearningSessionSchema],
    },
    { timestamps: true }
);

TargetNoteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model("TargetNote", TargetNoteSchema);

