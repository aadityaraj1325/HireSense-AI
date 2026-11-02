const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        suggestedActions: [
            {
                label: { type: String, required: true },
                url: { type: String, required: true },
                type: { type: String, default: "link" },
            },
        ],
        followUpQuestions: {
            type: [String],
            default: [],
        },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const chatConversationSchema = new mongoose.Schema(
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
            maxlength: 120,
            default: "New Conversation",
        },
        messages: {
            type: [chatMessageSchema],
            default: [],
        },
        contextSnapshot: {
            targetRole: { type: String, default: "" },
            resumeTitle: { type: String, default: "" },
            atsScore: { type: Number, default: null },
        },
        isPinned: {
            type: Boolean,
            default: false,
            index: true,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: true }
);

chatConversationSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
