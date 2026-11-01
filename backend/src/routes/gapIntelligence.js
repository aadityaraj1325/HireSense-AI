const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const CareerGapAnalysis = require("../models/CareerGapAnalysis");
const {
    SIMULATION_ACTIONS,
    runGapAnalysis,
    simulateCareerActions,
    submitGapEvidence,
    addGapToRoadmap,
    askGapCopilot,
} = require("../services/gapIntelligenceService");
const {
    ROLE_DEPENDENCY_TREES,
    getDependencyTreeForRole,
    buildVisualDnaGraph,
} = require("../services/skillDependencyDNA");

const router = express.Router();

// All gap intelligence endpoints require user authentication
router.use(requireAuth);

/**
 * GET /api/gap-intelligence/latest
 * Fetch the latest career gap analysis for current authenticated user.
 */
router.get(
    "/latest",
    asyncHandler(async (req, res) => {
        const analysis = await CareerGapAnalysis.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.json({
            success: true,
            analysis: analysis || null,
        });
    })
);

/**
 * GET /api/gap-intelligence/history
 * Fetch past gap analysis history list.
 */
router.get(
    "/history",
    asyncHandler(async (req, res) => {
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 25);
        const history = await CareerGapAnalysis.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select("targetRole overallReadinessScore matchScore evidenceCoverageScore learningCompletionScore createdAt gaps");

        return res.json({
            success: true,
            history,
        });
    })
);

/**
 * POST /api/gap-intelligence/analyze
 * Run an explainable multi-source gap analysis combining resume, platform evidence, and target role.
 */
const analyzeSchema = z.object({
    targetRole: z.string().trim().min(2, "Target role is required").max(100),
    targetJobDescription: z.string().max(10000).optional().default(""),
    resumeId: z.string().optional(),
    versionId: z.string().optional(),
});

router.post(
    "/analyze",
    validate(analyzeSchema),
    asyncHandler(async (req, res) => {
        const { targetRole, targetJobDescription, resumeId, versionId } = req.body;

        const analysis = await runGapAnalysis({
            userId: req.user._id,
            targetRole,
            targetJobDescription,
            resumeId,
            versionId,
        });

        return res.status(201).json({
            success: true,
            message: "Gap analysis completed successfully",
            analysis,
        });
    })
);

/**
 * GET /api/gap-intelligence/dna-graph
 * Retrieve visual Skill Dependency DNA Graph nodes and edges for target role.
 */
router.get(
    "/dna-graph",
    asyncHandler(async (req, res) => {
        const role = req.query.role || "Full Stack Engineer";
        const latestAnalysis = await CareerGapAnalysis.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

        // Gather currently evidenced skill names from latest analysis if available
        const demonstratedSkills = new Set();
        if (latestAnalysis) {
            for (const gap of latestAnalysis.gaps || []) {
                if (gap.status === "demonstrated" || gap.status === "partially_demonstrated") {
                    demonstratedSkills.add(gap.skillName.toLowerCase());
                }
            }
        }

        const tree = getDependencyTreeForRole(role);
        const graph = buildVisualDnaGraph(role, demonstratedSkills);

        return res.json({
            success: true,
            role,
            tree,
            graph,
            supportedRoles: Object.keys(ROLE_DEPENDENCY_TREES),
        });
    })
);

/**
 * GET /api/gap-intelligence/simulation-catalog
 * Available counterfactual actions catalog ("What happens if I learn this?").
 */
router.get(
    "/simulation-catalog",
    asyncHandler(async (req, res) => {
        return res.json({
            success: true,
            actions: SIMULATION_ACTIONS,
        });
    })
);

/**
 * POST /api/gap-intelligence/simulate
 * Run counterfactual career simulation with selected hypothetical actions.
 */
const simulateSchema = z.object({
    actionIds: z.array(z.string()).default([]),
    customActions: z.array(z.any()).optional().default([]),
});

router.post(
    "/simulate",
    validate(simulateSchema),
    asyncHandler(async (req, res) => {
        const { actionIds, customActions } = req.body;

        const simulation = await simulateCareerActions({
            userId: req.user._id,
            actionIds,
            customActions,
        });

        return res.json({
            success: true,
            simulation,
        });
    })
);

/**
 * POST /api/gap-intelligence/submit-evidence
 * Submit concrete proof (GitHub repo, PR, certification URL, demo) for a detected gap.
 */
const submitEvidenceSchema = z.object({
    gapId: z.string().min(1, "Gap ID is required"),
    skillName: z.string().min(1, "Skill name is required"),
    type: z.enum(["github_repo", "pull_request", "certification", "portfolio_project", "coding_challenge", "other"]),
    title: z.string().min(2, "Evidence title is required").max(150),
    url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    notes: z.string().max(2000).optional().default(""),
});

router.post(
    "/submit-evidence",
    validate(submitEvidenceSchema),
    asyncHandler(async (req, res) => {
        const result = await submitGapEvidence({
            userId: req.user._id,
            ...req.body,
        });

        return res.json({
            success: true,
            message: "Evidence submitted and verified successfully",
            ...result,
        });
    })
);

/**
 * POST /api/gap-intelligence/add-to-roadmap
 * Bridge a detected gap into CareerRoadmap as an active learning milestone & daily task.
 */
const addToRoadmapSchema = z.object({
    gapId: z.string().min(1, "Gap ID is required"),
});

router.post(
    "/add-to-roadmap",
    validate(addToRoadmapSchema),
    asyncHandler(async (req, res) => {
        const result = await addGapToRoadmap({
            userId: req.user._id,
            gapId: req.body.gapId,
        });

        return res.json({
            success: true,
            message: "Gap successfully bridged to Career Growth Roadmap",
            ...result,
        });
    })
);

/**
 * POST /api/gap-intelligence/copilot
 * Conversational Ask Gap Intelligence AI Copilot grounded in user's multi-source evidence.
 */
const copilotSchema = z.object({
    question: z.string().trim().min(2, "Question cannot be empty").max(1000),
});

router.post(
    "/copilot",
    validate(copilotSchema),
    asyncHandler(async (req, res) => {
        const reply = await askGapCopilot({
            userId: req.user._id,
            question: req.body.question,
        });

        return res.json({
            success: true,
            reply,
        });
    })
);

module.exports = router;

