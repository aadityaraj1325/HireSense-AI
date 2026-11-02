const express = require("express");
const crypto = require("crypto");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const ChatConversation = require("../models/ChatConversation");
const {
    getUserContextSnapshot,
    generateAssistantReply,
} = require("../services/askHireSenseAIService");

const router = express.Router();

router.use(requireAuth);

const createConvSchema = z.object({
    title: z.string().trim().max(120).optional(),
    initialMessage: z.string().trim().optional(),
});

const updateConvSchema = z.object({
    title: z.string().trim().max(120).optional(),
    isPinned: z.boolean().optional(),
});

const sendMessageSchema = z.object({
    message: z.string().trim().min(1, "Message content is required").max(4000),
});

/**
 * GET /api/chat/conversations
 * List user's conversation threads
 */
router.get(
    "/conversations",
    asyncHandler(async (req, res) => {
        const conversations = await ChatConversation.find({ userId: req.user._id })
            .sort({ isPinned: -1, lastMessageAt: -1 })
            .select("title isPinned lastMessageAt createdAt contextSnapshot messages")
            .lean();

        const formatted = conversations.map((c) => ({
            _id: c._id,
            title: c.title,
            isPinned: c.isPinned,
            lastMessageAt: c.lastMessageAt,
            createdAt: c.createdAt,
            contextSnapshot: c.contextSnapshot,
            messageCount: c.messages ? c.messages.length : 0,
            snippet: c.messages && c.messages.length > 0
                ? c.messages[c.messages.length - 1].content.slice(0, 90)
                : "",
        }));

        return res.json({
            success: true,
            conversations: formatted,
        });
    })
);

/**
 * POST /api/chat/conversations
 * Create a new conversation thread
 */
router.post(
    "/conversations",
    validate(createConvSchema),
    asyncHandler(async (req, res) => {
        const context = await getUserContextSnapshot(req.user._id);

        const newConversation = new ChatConversation({
            userId: req.user._id,
            title: req.body.title || "New Conversation",
            messages: [],
            contextSnapshot: {
                targetRole: context.targetRole,
                resumeTitle: context.resumeTitle,
                atsScore: context.atsScore,
            },
        });

        // If an initial message was provided, process it
        if (req.body.initialMessage) {
            const userMsgId = crypto.randomUUID();
            const userMessage = {
                id: userMsgId,
                role: "user",
                content: req.body.initialMessage,
                suggestedActions: [],
                followUpQuestions: [],
                createdAt: new Date(),
            };
            newConversation.messages.push(userMessage);

            // Auto-generate title from first message
            newConversation.title = req.body.initialMessage.slice(0, 40);

            const aiReply = await generateAssistantReply(req.user._id, [userMessage], req.body.initialMessage);
            const assistantMsgId = crypto.randomUUID();
            const assistantMessage = {
                id: assistantMsgId,
                role: "assistant",
                content: aiReply.content,
                suggestedActions: aiReply.suggestedActions || [],
                followUpQuestions: aiReply.followUpQuestions || [],
                createdAt: new Date(),
            };
            newConversation.messages.push(assistantMessage);
            newConversation.lastMessageAt = new Date();
        }

        await newConversation.save();

        return res.status(201).json({
            success: true,
            conversation: newConversation,
        });
    })
);

/**
 * GET /api/chat/conversations/:id
 * Retrieve single conversation with all message history
 */
router.get(
    "/conversations/:id",
    asyncHandler(async (req, res) => {
        const conversation = await ChatConversation.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!conversation) {
            throw ApiError.notFound("Conversation not found.");
        }

        return res.json({
            success: true,
            conversation,
        });
    })
);

/**
 * PATCH /api/chat/conversations/:id
 * Update title or pin state
 */
router.patch(
    "/conversations/:id",
    validate(updateConvSchema),
    asyncHandler(async (req, res) => {
        const conversation = await ChatConversation.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!conversation) {
            throw ApiError.notFound("Conversation not found.");
        }

        if (req.body.title !== undefined) conversation.title = req.body.title;
        if (req.body.isPinned !== undefined) conversation.isPinned = req.body.isPinned;

        await conversation.save();

        return res.json({
            success: true,
            conversation,
        });
    })
);

/**
 * DELETE /api/chat/conversations/:id
 * Delete a conversation
 */
router.delete(
    "/conversations/:id",
    asyncHandler(async (req, res) => {
        const result = await ChatConversation.deleteOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (result.deletedCount === 0) {
            throw ApiError.notFound("Conversation not found.");
        }

        return res.json({
            success: true,
            message: "Conversation deleted successfully.",
        });
    })
);

/**
 * POST /api/chat/conversations/:id/messages
 * Send message to an existing conversation and receive AI reply
 */
router.post(
    "/conversations/:id/messages",
    validate(sendMessageSchema),
    asyncHandler(async (req, res) => {
        const conversation = await ChatConversation.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!conversation) {
            throw ApiError.notFound("Conversation not found.");
        }

        const userMsg = {
            id: crypto.randomUUID(),
            role: "user",
            content: req.body.message,
            suggestedActions: [],
            followUpQuestions: [],
            createdAt: new Date(),
        };

        conversation.messages.push(userMsg);

        // If conversation still has default name, update from first user query
        if (conversation.title === "New Conversation" && conversation.messages.length <= 2) {
            conversation.title = req.body.message.slice(0, 45).trim();
        }

        // Generate Assistant response grounded in user data
        const aiReply = await generateAssistantReply(
            req.user._id,
            conversation.messages,
            req.body.message
        );

        const assistantMsg = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: aiReply.content,
            suggestedActions: aiReply.suggestedActions || [],
            followUpQuestions: aiReply.followUpQuestions || [],
            createdAt: new Date(),
        };

        conversation.messages.push(assistantMsg);
        conversation.lastMessageAt = new Date();

        await conversation.save();

        return res.json({
            success: true,
            userMessage: userMsg,
            assistantMessage: assistantMsg,
            conversation,
        });
    })
);

module.exports = router;

