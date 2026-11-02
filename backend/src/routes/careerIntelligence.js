const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { getCareerIntelligenceOverview } = require("../services/careerIntelligenceService");

const router = express.Router();

router.use(requireAuth);

/**
 * GET /api/career-intelligence/overview
 * Returns autonomous career intelligence dashboard data.
 */
router.get(
    "/overview",
    asyncHandler(async (req, res) => {
        const overview = await getCareerIntelligenceOverview(req.user._id);
        return res.json({
            success: true,
            data: overview,
        });
    })
);

/**
 * POST /api/career-intelligence/refresh
 * Forces a re-aggregation and fresh analysis of user data.
 */
router.post(
    "/refresh",
    asyncHandler(async (req, res) => {
        const overview = await getCareerIntelligenceOverview(req.user._id);
        return res.json({
            success: true,
            message: "Career intelligence analysis refreshed successfully.",
            data: overview,
        });
    })
);

module.exports = router;

